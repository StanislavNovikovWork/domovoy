'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, gt, isNull, ne, sql } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import {
  category,
  household,
  householdGuest,
  householdInvite,
  householdMember,
} from '@/server/db/schema';
import { requireHouseholdAccess } from '@/server/households/access';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_ONE_TIME_CATEGORIES,
} from '@/server/households/default-categories';
import { getInviteByToken, isInviteActive } from '@/server/households/queries';
import { requireSession } from '@/server/session';
import {
  acceptInviteSchema,
  addGuestSchema,
  createHouseholdSchema,
  householdIdSchema,
  removeGuestSchema,
  removeMemberSchema,
  renameHouseholdSchema,
  revokeInviteSchema,
} from '@/shared/schemas/household';

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; field?: string };

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DUPLICATE_NAME = 'Бюджет с таким названием уже есть';

// у пользователя не должно быть двух бюджетов с одинаковым названием (без учёта регистра)
async function hasDuplicateName(userId: string, name: string, excludeId?: string) {
  const [dup] = await db
    .select({ id: household.id })
    .from(household)
    .innerJoin(householdMember, eq(householdMember.householdId, household.id))
    .where(
      and(
        eq(householdMember.userId, userId),
        sql`lower(${household.name}) = lower(${name})`,
        ...(excludeId ? [ne(household.id, excludeId)] : [])
      )
    )
    .limit(1);
  return !!dup;
}

function generateToken() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
}

// действия с участниками, приглашениями и настройками доступны только владельцу бюджета
async function requireOwner(householdId: string) {
  const access = await requireHouseholdAccess(householdId);
  if (access.member.role !== 'owner') throw new Error('FORBIDDEN');
  return access;
}

export async function createHousehold(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = createHouseholdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите название' };

  try {
    const session = await requireSession();
    if (await hasDuplicateName(session.user.id, parsed.data.name)) {
      return { ok: false, error: DUPLICATE_NAME, field: 'name' };
    }
    const id = crypto.randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(household).values({
        id,
        name: parsed.data.name,
        kind: parsed.data.oneTime ? 'one_time' : 'periodic',
        createdBy: session.user.id,
      });
      await tx
        .insert(householdMember)
        .values({ householdId: id, userId: session.user.id, role: 'owner' });
      await tx
        .insert(category)
        .values(
          (parsed.data.oneTime ? DEFAULT_ONE_TIME_CATEGORIES : DEFAULT_CATEGORIES).map(
            (c, index) => ({ ...c, householdId: id, sortOrder: index })
          )
        );
    });

    revalidatePath('/budgets', 'layout');
    return { ok: true, id };
  } catch (error) {
    console.error('createHousehold failed', error);
    return { ok: false, error: 'Не удалось создать бюджет' };
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

    revalidatePath('/budgets', 'layout');
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
          isNull(householdInvite.revokedAt)
        )
      );

    revalidatePath('/budgets', 'layout');
    return { ok: true };
  } catch (error) {
    console.error('revokeInvite failed', error);
    return { ok: false, error: 'Не удалось отозвать приглашение' };
  }
}

export async function acceptInvite(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = acceptInviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Ссылка недействительна, попросите новую' };

  try {
    const session = await requireSession();
    const userId = session.user.id;

    const invite = await getInviteByToken(parsed.data.token);
    if (!invite || !isInviteActive(invite)) {
      return { ok: false, error: 'Ссылка недействительна, попросите новую' };
    }

    const [existing] = await db
      .select({ userId: householdMember.userId })
      .from(householdMember)
      .where(
        and(eq(householdMember.householdId, invite.householdId), eq(householdMember.userId, userId))
      )
      .limit(1);
    if (existing) return { ok: false, error: 'Вы уже в этом бюджете' };

    // ссылка многоразовая: не помечаем её использованной, действует пока не отозвана/не истекла
    await db
      .insert(householdMember)
      .values({ householdId: invite.householdId, userId, role: 'member' });

    revalidatePath('/budgets', 'layout');
    return { ok: true, id: invite.householdId };
  } catch (error) {
    console.error('acceptInvite failed', error);
    return { ok: false, error: 'Не удалось вступить в бюджет' };
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
          eq(householdMember.userId, parsed.data.userId)
        )
      );

    revalidatePath('/budgets', 'layout');
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
      return { ok: false, error: 'Владелец не может выйти из бюджета' };
    }

    await db
      .delete(householdMember)
      .where(
        and(
          eq(householdMember.householdId, parsed.data.householdId),
          eq(householdMember.userId, session.user.id)
        )
      );

    revalidatePath('/budgets', 'layout');
    return { ok: true };
  } catch (error) {
    console.error('leaveHousehold failed', error);
    return { ok: false, error: 'Не удалось выйти из бюджета' };
  }
}

export async function renameHousehold(input: unknown): Promise<Result> {
  const parsed = renameHouseholdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите название' };

  try {
    const { session } = await requireOwner(parsed.data.householdId);
    if (await hasDuplicateName(session.user.id, parsed.data.name, parsed.data.householdId)) {
      return { ok: false, error: DUPLICATE_NAME, field: 'name' };
    }
    await db
      .update(household)
      .set({ name: parsed.data.name })
      .where(eq(household.id, parsed.data.householdId));

    revalidatePath('/budgets', 'layout');
    return { ok: true };
  } catch (error) {
    console.error('renameHousehold failed', error);
    return { ok: false, error: 'Не удалось переименовать бюджет' };
  }
}

// участник без аккаунта: любой член бюджета может вписать имя; повтор имени не создаёт дубль
export async function addGuest(input: unknown): Promise<Result> {
  const parsed = addGuestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите имя' };

  try {
    await requireHouseholdAccess(parsed.data.householdId);
    await db
      .insert(householdGuest)
      .values({ householdId: parsed.data.householdId, name: parsed.data.name })
      .onConflictDoNothing();

    revalidatePath('/budgets', 'layout');
    return { ok: true };
  } catch (error) {
    console.error('addGuest failed', error);
    return { ok: false, error: 'Не удалось добавить участника' };
  }
}

export async function removeGuest(input: unknown): Promise<Result> {
  const parsed = removeGuestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };

  try {
    await requireOwner(parsed.data.householdId);
    await db
      .delete(householdGuest)
      .where(
        and(
          eq(householdGuest.id, parsed.data.guestId),
          eq(householdGuest.householdId, parsed.data.householdId)
        )
      );

    revalidatePath('/budgets', 'layout');
    return { ok: true };
  } catch (error) {
    console.error('removeGuest failed', error);
    return { ok: false, error: 'Не удалось удалить участника' };
  }
}

export async function deleteHousehold(input: unknown): Promise<Result> {
  const parsed = householdIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };

  try {
    await requireOwner(parsed.data.householdId);
    await db.delete(household).where(eq(household.id, parsed.data.householdId));

    revalidatePath('/budgets', 'layout');
    return { ok: true };
  } catch (error) {
    console.error('deleteHousehold failed', error);
    return { ok: false, error: 'Не удалось удалить бюджет' };
  }
}
