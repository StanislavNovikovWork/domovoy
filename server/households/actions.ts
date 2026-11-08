'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, isNull, ne, sql } from 'drizzle-orm';
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
import { getHouseholdById, getInviteByToken, isInviteActive } from '@/server/households/queries';
import { requireSession } from '@/server/session';
import {
  acceptInviteSchema,
  addGuestSchema,
  addTripGuestSchema,
  addTripParticipantSchema,
  createHouseholdSchema,
  householdIdSchema,
  removeGuestSchema,
  removeMemberSchema,
  renameHouseholdSchema,
  revokeInviteSchema,
  setSpaceIconSchema,
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

// у каждого пользователя должно быть своё периодическое пространство;
// создаём «Моё пространство», если периодических ещё нет (идемпотентно)
export async function ensurePersonalSpace(): Promise<{ ok: boolean; id?: string }> {
  try {
    const session = await requireSession();
    // блокируем строку пользователя: параллельные вызовы (двойной рендер, два таба)
    // не должны создать два личных пространства
    return await db.transaction(async (tx) => {
      await tx.execute(sql`select id from "user" where id = ${session.user.id} for update`);

      const [existing] = await tx
        .select({ id: household.id })
        .from(householdMember)
        .innerJoin(household, eq(household.id, householdMember.householdId))
        .where(
          and(
            eq(householdMember.userId, session.user.id),
            eq(household.kind, 'periodic'),
            isNull(household.parentId)
          )
        )
        .limit(1);
      if (existing) return { ok: true as const, id: existing.id };

      const id = crypto.randomUUID();
      await tx.insert(household).values({
        id,
        name: 'Моё пространство',
        kind: 'periodic',
        createdBy: session.user.id,
      });
      await tx
        .insert(householdMember)
        .values({ householdId: id, userId: session.user.id, role: 'owner' });
      await tx
        .insert(category)
        .values(
          DEFAULT_CATEGORIES.map((c, index) => ({ ...c, householdId: id, sortOrder: index }))
        );
      return { ok: true as const, id };
    });
  } catch (error) {
    console.error('ensurePersonalSpace failed', error);
    return { ok: false };
  }
}

// действия с участниками, приглашениями и настройками доступны только владельцу бюджета
async function requireOwner(householdId: string) {
  const access = await requireHouseholdAccess(householdId);
  if (access.member.role !== 'owner') throw new Error('FORBIDDEN');
  return access;
}

// id родительского пространства, если бюджет — разовая поездка; иначе null
async function getTripParentId(householdId: string) {
  const [trip] = await db
    .select({ kind: household.kind, parentId: household.parentId })
    .from(household)
    .where(eq(household.id, householdId))
    .limit(1);
  return trip?.kind === 'one_time' && trip.parentId ? trip.parentId : null;
}

export async function createHousehold(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = createHouseholdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите название' };

  try {
    const session = await requireSession();
    if (await hasDuplicateName(session.user.id, parsed.data.name)) {
      return { ok: false, error: DUPLICATE_NAME, field: 'name' };
    }
    // проект: родительское пространство должно существовать и быть доступно
    if (parsed.data.parentId) {
      const parent = await getHouseholdById(parsed.data.parentId);
      if (!parent) return { ok: false, error: 'Пространство не найдено' };
      await requireHouseholdAccess(parsed.data.parentId);
    }
    const id = crypto.randomUUID();
    // вид выводится из места в иерархии: корень — периодическое пространство,
    // дочерний бюджет — всегда разовый проект
    const oneTime = Boolean(parsed.data.parentId);
    await db.transaction(async (tx) => {
      await tx.insert(household).values({
        id,
        name: parsed.data.name,
        kind: oneTime ? 'one_time' : 'periodic',
        createdBy: session.user.id,
        parentId: parsed.data.parentId ?? null,
      });
      await tx
        .insert(householdMember)
        .values({ householdId: id, userId: session.user.id, role: 'owner' });
      await tx
        .insert(category)
        .values(
          (oneTime ? DEFAULT_ONE_TIME_CATEGORIES : DEFAULT_CATEGORIES).map(
            (c, index) => ({ ...c, householdId: id, sortOrder: index })
          )
        );
    });

    revalidatePath('/', 'layout');
    return { ok: true, id };
  } catch (error) {
    console.error('createHousehold failed', error);
    return { ok: false, error: 'Не удалось создать пространство' };
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

    revalidatePath('/', 'layout');
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

    revalidatePath('/', 'layout');
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

    revalidatePath('/', 'layout');
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

    revalidatePath('/', 'layout');
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

    revalidatePath('/', 'layout');
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

    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    console.error('renameHousehold failed', error);
    return { ok: false, error: 'Не удалось переименовать бюджет' };
  }
}

// иконка пространства: выбирает владелец, null — убрать иконку
export async function setSpaceIcon(input: unknown): Promise<Result> {
  const parsed = setSpaceIconSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };

  try {
    await requireOwner(parsed.data.householdId);
    await db
      .update(household)
      .set({ icon: parsed.data.icon })
      .where(eq(household.id, parsed.data.householdId));

    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    console.error('setSpaceIcon failed', error);
    return { ok: false, error: 'Не удалось сохранить иконку' };
  }
}

// настройки поездки: название правит любой участник, участники добавляются из пространства
export async function renameTrip(input: unknown): Promise<Result> {
  const parsed = renameHouseholdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите название' };

  try {
    await requireHouseholdAccess(parsed.data.householdId);
    if (!(await getTripParentId(parsed.data.householdId))) {
      return { ok: false, error: 'Настройки есть только у поездки' };
    }
    await db
      .update(household)
      .set({ name: parsed.data.name })
      .where(eq(household.id, parsed.data.householdId));

    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    console.error('renameTrip failed', error);
    return { ok: false, error: 'Не удалось переименовать поездку' };
  }
}

export async function addTripParticipant(input: unknown): Promise<Result> {
  const parsed = addTripParticipantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };

  try {
    await requireHouseholdAccess(parsed.data.householdId);
    const parentId = await getTripParentId(parsed.data.householdId);
    if (!parentId) return { ok: false, error: 'Настройки есть только у поездки' };

    const [inSpace] = await db
      .select({ userId: householdMember.userId })
      .from(householdMember)
      .where(
        and(
          eq(householdMember.householdId, parentId),
          eq(householdMember.userId, parsed.data.userId)
        )
      )
      .limit(1);
    if (!inSpace) return { ok: false, error: 'Участник не найден в пространстве' };

    await db
      .insert(householdMember)
      .values({
        householdId: parsed.data.householdId,
        userId: parsed.data.userId,
        role: 'member',
      })
      .onConflictDoNothing();

    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    console.error('addTripParticipant failed', error);
    return { ok: false, error: 'Не удалось добавить участника' };
  }
}

export async function removeTripParticipant(input: unknown): Promise<Result> {
  const parsed = removeMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };

  try {
    await requireHouseholdAccess(parsed.data.householdId);
    if (!(await getTripParentId(parsed.data.householdId))) {
      return { ok: false, error: 'Настройки есть только у поездки' };
    }

    const [target] = await db
      .select({ role: householdMember.role })
      .from(householdMember)
      .where(
        and(
          eq(householdMember.householdId, parsed.data.householdId),
          eq(householdMember.userId, parsed.data.userId)
        )
      )
      .limit(1);
    if (target?.role === 'owner') {
      return { ok: false, error: 'Владельца поездки нельзя удалить' };
    }

    await db
      .delete(householdMember)
      .where(
        and(
          eq(householdMember.householdId, parsed.data.householdId),
          eq(householdMember.userId, parsed.data.userId)
        )
      );

    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    console.error('removeTripParticipant failed', error);
    return { ok: false, error: 'Не удалось удалить участника' };
  }
}

export async function addTripGuest(input: unknown): Promise<Result> {
  const parsed = addTripGuestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите имя' };

  try {
    await requireHouseholdAccess(parsed.data.householdId);
    const parentId = await getTripParentId(parsed.data.householdId);
    if (!parentId) return { ok: false, error: 'Настройки есть только у поездки' };

    const guests = await db
      .select({ name: householdGuest.name })
      .from(householdGuest)
      .where(eq(householdGuest.householdId, parentId));
    const name = parsed.data.name.trim();
    if (!guests.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
      return { ok: false, error: 'Участник не найден в пространстве' };
    }

    await db
      .insert(householdGuest)
      .values({ householdId: parsed.data.householdId, name })
      .onConflictDoNothing();

    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    console.error('addTripGuest failed', error);
    return { ok: false, error: 'Не удалось добавить участника' };
  }
}

export async function removeTripGuest(input: unknown): Promise<Result> {
  const parsed = removeGuestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };

  try {
    await requireHouseholdAccess(parsed.data.householdId);
    if (!(await getTripParentId(parsed.data.householdId))) {
      return { ok: false, error: 'Настройки есть только у поездки' };
    }

    await db
      .delete(householdGuest)
      .where(
        and(eq(householdGuest.id, parsed.data.guestId), eq(householdGuest.householdId, parsed.data.householdId))
      );

    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    console.error('removeTripGuest failed', error);
    return { ok: false, error: 'Не удалось удалить участника' };
  }
}

// участник без аккаунта: имя вписывает только владелец; повтор имени не создаёт дубль
export async function addGuest(input: unknown): Promise<Result> {
  const parsed = addGuestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите имя' };

  try {
    await requireOwner(parsed.data.householdId);
    await db
      .insert(householdGuest)
      .values({ householdId: parsed.data.householdId, name: parsed.data.name })
      .onConflictDoNothing();

    revalidatePath('/', 'layout');
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

    revalidatePath('/', 'layout');
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

    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (error) {
    console.error('deleteHousehold failed', error);
    return { ok: false, error: 'Не удалось удалить бюджет' };
  }
}
