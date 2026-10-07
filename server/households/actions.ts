'use server';

import 'server-only';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db';
import { category, household, householdInvite, householdMember } from '@/server/db/schema';
import { requireHouseholdAccess } from '@/server/households/access';
import { DEFAULT_CATEGORIES } from '@/server/households/default-categories';
import { getFamilyHousehold, getInviteByToken, isInviteActive } from '@/server/households/queries';
import { requireSession } from '@/server/session';
import {
  acceptInviteSchema,
  createFamilySchema,
  householdIdSchema,
  removeMemberSchema,
  revokeInviteSchema,
} from '@/shared/schemas/household';

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateToken() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
}

// действия с участниками и приглашениями доступны только владельцу семьи
async function requireOwner(householdId: string) {
  const access = await requireHouseholdAccess(householdId);
  if (access.member.role !== 'owner') throw new Error('FORBIDDEN');
  return access;
}

export async function createFamilyHousehold(input: unknown): Promise<Result> {
  const parsed = createFamilySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите название' };

  try {
    const session = await requireSession();
    if (await getFamilyHousehold(session.user.id)) {
      return { ok: false, error: 'Вы уже состоите в семье' };
    }

    const id = crypto.randomUUID();
    await db.batch([
      db.insert(household).values({ id, name: parsed.data.name, type: 'family', createdBy: session.user.id }),
      db.insert(householdMember).values({ householdId: id, userId: session.user.id, role: 'owner' }),
      db.insert(category).values(
        DEFAULT_CATEGORIES.map((c, index) => ({ ...c, householdId: id, sortOrder: index })),
      ),
    ]);

    revalidatePath('/family');
    return { ok: true };
  } catch (error) {
    console.error('createFamilyHousehold failed', error);
    return { ok: false, error: 'Не удалось создать семью' };
  }
}

export async function createInvite(input: unknown): Promise<Result<{ token: string }>> {
  const parsed = householdIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };

  try {
    const { session } = await requireOwner(parsed.data.householdId);
    const token = generateToken();

    await db.insert(householdInvite).values({
      householdId: parsed.data.householdId,
      token,
      createdBy: session.user.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    });

    revalidatePath('/family');
    return { ok: true, token };
  } catch (error) {
    console.error('createInvite failed', error);
    return { ok: false, error: 'Не удалось создать приглашение' };
  }
}

export async function revokeInvite(input: unknown): Promise<Result> {
  const parsed = revokeInviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };

  try {
    await requireOwner(parsed.data.householdId);

    await db
      .update(householdInvite)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(householdInvite.id, parsed.data.inviteId),
          eq(householdInvite.householdId, parsed.data.householdId),
          isNull(householdInvite.revokedAt),
        ),
      );

    revalidatePath('/family');
    return { ok: true };
  } catch (error) {
    console.error('revokeInvite failed', error);
    return { ok: false, error: 'Не удалось отозвать приглашение' };
  }
}

export async function acceptInvite(input: unknown): Promise<Result> {
  const parsed = acceptInviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Ссылка недействительна, попросите новую' };

  try {
    const session = await requireSession();
    const userId = session.user.id;

    const invite = await getInviteByToken(parsed.data.token);
    if (!invite || !isInviteActive(invite)) {
      return { ok: false, error: 'Ссылка недействительна, попросите новую' };
    }

    const family = await getFamilyHousehold(userId);
    if (family?.id === invite.householdId) return { ok: false, error: 'Вы уже в этой семье' };
    if (family) return { ok: false, error: 'Вы уже состоите в семье' };

    // помечаем использованным условно: если успел кто-то другой, строк не вернётся
    const claimed = await db
      .update(householdInvite)
      .set({ usedBy: userId, usedAt: new Date() })
      .where(
        and(
          eq(householdInvite.id, invite.id),
          isNull(householdInvite.usedAt),
          isNull(householdInvite.revokedAt),
          gt(householdInvite.expiresAt, new Date()),
        ),
      )
      .returning({ id: householdInvite.id });
    if (claimed.length === 0) return { ok: false, error: 'Ссылка недействительна, попросите новую' };

    try {
      await db.insert(householdMember).values({ householdId: invite.householdId, userId, role: 'member' });
    } catch (error) {
      // откатываем пометку, чтобы ссылка осталась рабочей
      await db
        .update(householdInvite)
        .set({ usedBy: null, usedAt: null })
        .where(eq(householdInvite.id, invite.id));
      throw error;
    }

    revalidatePath('/family');
    return { ok: true };
  } catch (error) {
    console.error('acceptInvite failed', error);
    return { ok: false, error: 'Не удалось вступить в семью' };
  }
}

export async function removeMember(input: unknown): Promise<Result> {
  const parsed = removeMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };

  try {
    const { session } = await requireOwner(parsed.data.householdId);
    if (parsed.data.userId === session.user.id) {
      return { ok: false, error: 'Владелец не может удалить себя' };
    }

    await db
      .delete(householdMember)
      .where(
        and(
          eq(householdMember.householdId, parsed.data.householdId),
          eq(householdMember.userId, parsed.data.userId),
        ),
      );

    revalidatePath('/family');
    return { ok: true };
  } catch (error) {
    console.error('removeMember failed', error);
    return { ok: false, error: 'Не удалось удалить участника' };
  }
}

export async function leaveHousehold(input: unknown): Promise<Result> {
  const parsed = householdIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };

  try {
    const { session, member } = await requireHouseholdAccess(parsed.data.householdId);
    if (member.role === 'owner') {
      return { ok: false, error: 'Владелец не может выйти из семьи' };
    }

    await db
      .delete(householdMember)
      .where(
        and(
          eq(householdMember.householdId, parsed.data.householdId),
          eq(householdMember.userId, session.user.id),
        ),
      );

    revalidatePath('/family');
    return { ok: true };
  } catch (error) {
    console.error('leaveHousehold failed', error);
    return { ok: false, error: 'Не удалось выйти из семьи' };
  }
}
