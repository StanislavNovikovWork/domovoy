import { desc, eq, sql } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { transaction, transactionShare, category } from '@/server/db/schema';

export async function listAllTransactions(householdId: string) {
  return db
    .select({
      id: transaction.id,
      amount: transaction.amount,
      occurredOn: transaction.occurredOn,
      note: transaction.note,
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
}

// суммы по участникам расходов (transaction_share) по всему бюджету, от большей к меньшей
export async function listShareTotals(householdId: string) {
  return db
    .select({
      name: transactionShare.name,
      total: sql<number>`sum(${transactionShare.amount})::int`,
    })
    .from(transactionShare)
    .innerJoin(transaction, eq(transaction.id, transactionShare.transactionId))
    .where(eq(transaction.householdId, householdId))
    .groupBy(transactionShare.name)
    .orderBy(desc(sql`sum(${transactionShare.amount})`));
}
