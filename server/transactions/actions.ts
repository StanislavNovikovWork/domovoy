'use server';

import { and, eq, isNull } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import {
  category,
  household,
  householdMember,
  transaction,
  transactionShare,
} from '@/server/db/schema';
import { requireHouseholdAccess, revalidateBudgetPages } from '@/server/households/access';
import { createTransactionSchema } from '@/shared/schemas/transaction';

type Result = { ok: true } | { ok: false; error: string };

export async function createTransaction(input: unknown): Promise<Result> {
  // 1. Валидация входа
  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Проверьте введённые данные' };
  const data = parsed.data;

  try {
    // 2. Сессия и членство в бюджете
    const { session } = await requireHouseholdAccess(data.householdId);

    // 3. Категория должна принадлежать этому бюджету и быть не в архиве
    const [cat] = await db
      .select({ id: category.id })
      .from(category)
      .where(
        and(
          eq(category.id, data.categoryId),
          eq(category.householdId, data.householdId),
          isNull(category.archivedAt)
        )
      )
      .limit(1);
    if (!cat) return { ok: false, error: 'Категория не найдена' };

    const [h] = await db
      .select({ kind: household.kind })
      .from(household)
      .where(eq(household.id, data.householdId))
      .limit(1);
    const oneTime = h?.kind === 'one_time';

    // 4. Кто платил (разовый бюджет): по умолчанию автор; член бюджета должен состоять в нём
    let paidBy: { userId: string | null; name: string } | null = null;
    if (oneTime) {
      paidBy = data.paidBy ?? { userId: session.user.id, name: session.user.name };
      if (paidBy.userId) {
        const [m] = await db
          .select({ userId: householdMember.userId })
          .from(householdMember)
          .where(
            and(
              eq(householdMember.householdId, data.householdId),
              eq(householdMember.userId, paidBy.userId)
            )
          )
          .limit(1);
        if (!m) return { ok: false, error: 'Плательщик не состоит в бюджете' };
      }
    }

    // 5. Запись
    const [row] = await db
      .insert(transaction)
      .values({
        householdId: data.householdId,
        categoryId: data.categoryId,
        amount: data.amount,
        occurredOn: data.occurredOn,
        note: data.note || null,
        createdBy: session.user.id,
        paidByUserId: paidBy?.userId ?? null,
        paidByName: paidBy?.name ?? null,
      })
      .returning({ id: transaction.id });

    // в разовом бюджете без выбранных участников расход целиком записывается на автора
    let shares = data.shares ?? [];
    if (shares.length === 0 && oneTime) {
      shares = [{ userId: session.user.id, name: session.user.name, amount: data.amount }];
    }

    if (shares.length > 0) {
      await db.insert(transactionShare).values(
        shares.map((s) => ({
          transactionId: row.id,
          userId: s.userId,
          name: s.name,
          amount: s.amount,
        }))
      );
    }

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('createTransaction failed', error);
    return { ok: false, error: 'Не удалось сохранить операцию' };
  }
}
