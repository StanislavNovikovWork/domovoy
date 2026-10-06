import 'server-only';
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { transaction, category } from '@/server/db/schema';
import { getMonthRange } from '@/shared/lib/month';

// Транзакции бюджета за месяц, новые сверху
export async function listMonthTransactions(householdId: string, month: string) {
  const { from, to } = getMonthRange(month);
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
    .where(
      and(
        eq(transaction.householdId, householdId),
        gte(transaction.occurredOn, from),
        lt(transaction.occurredOn, to),
      ),
    )
    .orderBy(desc(transaction.occurredOn), desc(transaction.createdAt));
}

// Суммы за месяц по категориям (для блока «расходы по категориям» и итогов)
export async function getMonthTotalsByCategory(householdId: string, month: string) {
  const { from, to } = getMonthRange(month);
  const rows = await db
    .select({
      categoryId: category.id,
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
      total: sql<string>`sum(${transaction.amount})`,
    })
    .from(transaction)
    .innerJoin(category, eq(category.id, transaction.categoryId))
    .where(
      and(
        eq(transaction.householdId, householdId),
        gte(transaction.occurredOn, from),
        lt(transaction.occurredOn, to),
      ),
    )
    .groupBy(category.id)
    .orderBy(sql`sum(${transaction.amount}) desc`);

  // sum в Postgres приходит строкой, приводим к числу (копейки)
  return rows.map((r) => ({ ...r, total: Number(r.total) }));
}