import { desc, eq } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { transaction, category } from '@/server/db/schema';

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
