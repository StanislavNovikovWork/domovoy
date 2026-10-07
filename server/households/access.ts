import 'server-only';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db';
import { householdMember } from '@/server/db/schema';
import { requireSession } from '@/server/session';

// Бросает ошибку, если пользователь не состоит в этом бюджете
export async function requireHouseholdAccess(householdId: string) {
  const session = await requireSession();
  const [member] = await db
    .select()
    .from(householdMember)
    .where(
      and(
        eq(householdMember.householdId, householdId),
        eq(householdMember.userId, session.user.id),
      ),
    )
    .limit(1);
  if (!member) throw new Error('FORBIDDEN');
  return { session, member };
}

// Операции и категории показываются и в личном, и в семейном бюджете
export function revalidateBudgetPages() {
  revalidatePath('/');
  revalidatePath('/family');
}