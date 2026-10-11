'use server';

import { and, eq, isNull } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { category, transaction, transactionShare } from '@/server/db/schema';
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

    // 4. Запись
    const [row] = await db
      .insert(transaction)
      .values({
        householdId: data.householdId,
        categoryId: data.categoryId,
        amount: data.amount,
        occurredOn: data.occurredOn,
        note: data.note || null,
        createdBy: session.user.id,
      })
      .returning({ id: transaction.id });

    if (data.shares?.length) {
      await db.insert(transactionShare).values(
        data.shares.map((s) => ({
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
