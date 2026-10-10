import { asc, eq } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { budgetPlan, budgetPlanItem } from '@/server/db/schema';
import type { PlanItem } from '@/shared/lib/budget';

// планы всех месяцев со статьями: данных мало, переключение месяца обходится без запросов
export async function listPlans(householdId: string): Promise<PlanItem[]> {
  const [plans, items] = await Promise.all([
    db
      .select({
        id: budgetPlan.id,
        categoryId: budgetPlan.categoryId,
        month: budgetPlan.month,
        amount: budgetPlan.amount,
      })
      .from(budgetPlan)
      .where(eq(budgetPlan.householdId, householdId)),
    db
      .select({
        planId: budgetPlanItem.planId,
        name: budgetPlanItem.name,
        amount: budgetPlanItem.amount,
      })
      .from(budgetPlanItem)
      .innerJoin(budgetPlan, eq(budgetPlan.id, budgetPlanItem.planId))
      .where(eq(budgetPlan.householdId, householdId))
      .orderBy(asc(budgetPlanItem.createdAt)),
  ]);

  const byPlan = new Map<string, { name: string; amount: number }[]>();
  for (const i of items) {
    byPlan.set(i.planId, [...(byPlan.get(i.planId) ?? []), { name: i.name, amount: i.amount }]);
  }

  return plans.map((p) => ({
    categoryId: p.categoryId,
    month: p.month,
    amount: p.amount,
    items: byPlan.get(p.id) ?? [],
  }));
}
