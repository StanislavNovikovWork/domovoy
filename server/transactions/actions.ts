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
import {
  createTransactionSchema,
  deleteTransactionSchema,
  updateTransactionSchema,
  type CreateTransactionInput,
} from '@/shared/schemas/transaction';

type Result = { ok: true } | { ok: false; error: string };

type Prepared = {
  paidBy: { userId: string | null; name: string } | null;
  shares: { userId: string | null; name: string; amount: number }[];
};

// Общая проверка и подготовка для создания и редактирования: категория, плательщик, доли
async function prepare(
  data: CreateTransactionInput,
  session: { user: { id: string; name: string } }
): Promise<Prepared | { error: string }> {
  // категория должна принадлежать этому бюджету и быть не в архиве
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
  if (!cat) return { error: 'Категория не найдена' };

  const [h] = await db
    .select({ kind: household.kind })
    .from(household)
    .where(eq(household.id, data.householdId))
    .limit(1);
  const oneTime = h?.kind === 'one_time';

  // кто платил (разовый бюджет): по умолчанию автор; член бюджета должен состоять в нём
  let paidBy: Prepared['paidBy'] = null;
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
      if (!m) return { error: 'Плательщик не состоит в бюджете' };
    }
  }

  // в разовом бюджете без выбранных участников расход целиком записывается на автора
  let shares = data.shares ?? [];
  if (shares.length === 0 && oneTime) {
    shares = [{ userId: session.user.id, name: session.user.name, amount: data.amount }];
  }

  return { paidBy, shares };
}

export async function createTransaction(input: unknown): Promise<Result> {
  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Проверьте введённые данные' };
  const data = parsed.data;

  try {
    const { session } = await requireHouseholdAccess(data.householdId);

    const prepared = await prepare(data, session);
    if ('error' in prepared) return { ok: false, error: prepared.error };
    const { paidBy, shares } = prepared;

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

export async function updateTransaction(input: unknown): Promise<Result> {
  const parsed = updateTransactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Проверьте введённые данные' };
  const data = parsed.data;

  try {
    const { session } = await requireHouseholdAccess(data.householdId);

    // операция должна принадлежать этому бюджету
    const [existing] = await db
      .select({ id: transaction.id })
      .from(transaction)
      .where(and(eq(transaction.id, data.id), eq(transaction.householdId, data.householdId)))
      .limit(1);
    if (!existing) return { ok: false, error: 'Операция не найдена' };

    const prepared = await prepare(data, session);
    if ('error' in prepared) return { ok: false, error: prepared.error };
    const { paidBy, shares } = prepared;

    // обновление операции и пересборка долей одним batch (атомарно)
    await db.batch([
      db
        .update(transaction)
        .set({
          categoryId: data.categoryId,
          amount: data.amount,
          occurredOn: data.occurredOn,
          note: data.note || null,
          paidByUserId: paidBy?.userId ?? null,
          paidByName: paidBy?.name ?? null,
        })
        .where(eq(transaction.id, data.id)),
      db.delete(transactionShare).where(eq(transactionShare.transactionId, data.id)),
      ...(shares.length > 0
        ? [
            db.insert(transactionShare).values(
              shares.map((s) => ({
                transactionId: data.id,
                userId: s.userId,
                name: s.name,
                amount: s.amount,
              }))
            ),
          ]
        : []),
    ]);

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('updateTransaction failed', error);
    return { ok: false, error: 'Не удалось сохранить операцию' };
  }
}

export async function deleteTransaction(input: unknown): Promise<Result> {
  const parsed = deleteTransactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);

    const deleted = await db
      .delete(transaction)
      .where(and(eq(transaction.id, data.id), eq(transaction.householdId, data.householdId)))
      .returning({ id: transaction.id });
    if (deleted.length === 0) return { ok: false, error: 'Операция не найдена' };

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('deleteTransaction failed', error);
    return { ok: false, error: 'Не удалось удалить операцию' };
  }
}
