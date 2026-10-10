import { cache } from 'react';
import { and, asc, eq, gt, isNull, sql } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { household, householdInvite, householdMember, user } from '@/server/db/schema';

const householdColumns = {
  id: household.id,
  name: household.name,
  type: household.type,
  role: householdMember.role,
};

// cache() выполняет запрос один раз за HTTP-запрос
export const getPersonalHousehold = cache(async (userId: string) => {
  const [row] = await db
    .select(householdColumns)
    .from(householdMember)
    .innerJoin(household, eq(household.id, householdMember.householdId))
    .where(and(eq(householdMember.userId, userId), eq(household.type, 'personal')))
    .orderBy(asc(householdMember.joinedAt))
    .limit(1);
  return row ?? null;
});

// бюджет, если пользователь в нём состоит
export const getUserHousehold = cache(async (userId: string, householdId: string) => {
  const [row] = await db
    .select(householdColumns)
    .from(householdMember)
    .innerJoin(household, eq(household.id, householdMember.householdId))
    .where(and(eq(householdMember.userId, userId), eq(household.id, householdId)))
    .limit(1);
  return row ?? null;
});

export type HouseholdListItem = Awaited<ReturnType<typeof listUserHouseholds>>[number];

// все общие (не личные) бюджеты пользователя
export async function listUserHouseholds(userId: string) {
  return db
    .select({
      ...householdColumns,
      membersCount: sql<number>`(select count(*)::int from ${householdMember} hm where hm.household_id = ${household.id})`,
    })
    .from(householdMember)
    .innerJoin(household, eq(household.id, householdMember.householdId))
    .where(and(eq(householdMember.userId, userId), eq(household.type, 'family')))
    .orderBy(asc(household.createdAt));
}

export type HouseholdMemberItem = Awaited<ReturnType<typeof listMembers>>[number];

export async function listMembers(householdId: string) {
  return db
    .select({
      userId: householdMember.userId,
      name: user.name,
      email: user.email,
      role: householdMember.role,
      joinedAt: householdMember.joinedAt,
    })
    .from(householdMember)
    .innerJoin(user, eq(user.id, householdMember.userId))
    .where(eq(householdMember.householdId, householdId))
    .orderBy(asc(householdMember.joinedAt));
}

export type InviteItem = Awaited<ReturnType<typeof listActiveInvites>>[number];

// действующие приглашения: не использованы, не отозваны, не истекли
export async function listActiveInvites(householdId: string) {
  return db
    .select({
      id: householdInvite.id,
      token: householdInvite.token,
      createdAt: householdInvite.createdAt,
      expiresAt: householdInvite.expiresAt,
    })
    .from(householdInvite)
    .where(
      and(
        eq(householdInvite.householdId, householdId),
        isNull(householdInvite.usedAt),
        isNull(householdInvite.revokedAt),
        gt(householdInvite.expiresAt, new Date())
      )
    )
    .orderBy(asc(householdInvite.createdAt));
}

// приглашение по токену вместе с названием семьи и именем пригласившего (для страницы /invite)
export async function getInviteByToken(token: string) {
  const [row] = await db
    .select({
      id: householdInvite.id,
      householdId: householdInvite.householdId,
      householdName: household.name,
      inviterName: user.name,
      expiresAt: householdInvite.expiresAt,
      usedAt: householdInvite.usedAt,
      revokedAt: householdInvite.revokedAt,
    })
    .from(householdInvite)
    .innerJoin(household, eq(household.id, householdInvite.householdId))
    .innerJoin(user, eq(user.id, householdInvite.createdBy))
    .where(eq(householdInvite.token, token))
    .limit(1);
  return row ?? null;
}

export function isInviteActive(invite: {
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
}) {
  return !invite.usedAt && !invite.revokedAt && invite.expiresAt > new Date();
}
