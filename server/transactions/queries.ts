import { desc, eq } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { transaction, transactionShare, category } from '@/server/db/schema';

export async function listAllTransactions(householdId: string) {
  const rows = await db
    .select({
      id: transaction.id,
      amount: transaction.amount,
      occurredOn: transaction.occurredOn,
      note: transaction.note,
      paidByUserId: transaction.paidByUserId,
      paidByName: transaction.paidByName,
      categoryId: category.id,
      categoryName: category.name,
      categoryType: category.type,
      categoryIcon: category.icon,
      categoryColor: category.color,
    })
    .from(transaction)
    .innerJoin(category, eq(category.id, transaction.categoryId))
    .where(eq(transaction.householdId, householdId))
    .orderBy(desc(transaction.occurredOn), desc(transaction.createdAt));

  // доли участников по операциям бюджета (в разовых бюджетах)
  const shareRows = await db
    .select({
      transactionId: transactionShare.transactionId,
      userId: transactionShare.userId,
      name: transactionShare.name,
      amount: transactionShare.amount,
    })
    .from(transactionShare)
    .innerJoin(transaction, eq(transaction.id, transactionShare.transactionId))
    .where(eq(transaction.householdId, householdId))
    .orderBy(desc(transactionShare.amount));

  const byTransaction = new Map<
    string,
    { userId: string | null; name: string; amount: number }[]
  >();
  for (const s of shareRows) {
    const list = byTransaction.get(s.transactionId) ?? [];
    list.push({ userId: s.userId, name: s.name, amount: s.amount });
    byTransaction.set(s.transactionId, list);
  }

  return rows.map((r) => ({ ...r, shares: byTransaction.get(r.id) ?? [] }));
}

