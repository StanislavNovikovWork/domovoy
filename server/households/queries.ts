import 'server-only';
import { cache } from 'react';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/server/db';
import { household, householdMember } from '@/server/db/schema';

async function findUserHousehold(userId: string, type: 'personal' | 'family') {
  const [row] = await db
    .select({
      id: household.id,
      name: household.name,
      type: household.type,
      role: householdMember.role,
    })
    .from(householdMember)
    .innerJoin(household, eq(household.id, householdMember.householdId))
    .where(and(eq(householdMember.userId, userId), eq(household.type, type)))
    .orderBy(asc(householdMember.joinedAt))
    .limit(1);
  return row ?? null;
}

// cache() выполняет запрос один раз за HTTP-запрос
export const getPersonalHousehold = cache((userId: string) => findUserHousehold(userId, 'personal'));
export const getFamilyHousehold = cache((userId: string) => findUserHousehold(userId, 'family'));