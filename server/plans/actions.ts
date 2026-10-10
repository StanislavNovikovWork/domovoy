'use server';

import { and, eq, isNull, sql } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { budgetPlan, budgetPlanItem, category } from '@/server/db/schema';
import { requireHouseholdAccess, revalidateBudgetPages } from '@/server/households/access';
import {
  copyPlanSchema,
  removePlanItemSchema,
  removePlanSchema,
  setPlanItemSchema,
  setPlanSchema,
} from '@/shared/schemas/plan';

type Result = { ok: true } | { ok: false; error: string };

// планировать можно только активные расходные категории этого бюджета
async function isPlannableCategory(householdId: string, categoryId: string) {
  const [cat] = await db
    .select({ id: category.id })
    .from(category)
    .where(
      and(
        eq(category.id, categoryId),
        eq(category.householdId, householdId),
        eq(category.type, 'expense'),
        isNull(category.archivedAt)
      )
    )
    .limit(1);
  return Boolean(cat);
}

async function findPlanId(householdId: string, categoryId: string, month: string) {
  const [plan] = await db
    .select({ id: budgetPlan.id })
    .from(budgetPlan)
    .where(
      and(
        eq(budgetPlan.householdId, householdId),
        eq(budgetPlan.categoryId, categoryId),
        eq(budgetPlan.month, month)
      )
    )
    .limit(1);
  return plan?.id ?? null;
}

// сумма плана категории = сумма её статей (если статей не осталось, сумма не меняется)
function recomputeAmount(planId: string) {
  return db
    .update(budgetPlan)
    .set({
      amount: sql`coalesce(nullif((select sum(${budgetPlanItem.amount}) from ${budgetPlanItem} where ${budgetPlanItem.planId} = ${planId}), 0), ${budgetPlan.amount})`,
      updatedAt: new Date(),
    })
    .where(eq(budgetPlan.id, planId));
}

// статья плана становится подсказкой «Что конкретно» у категории (без повторов, не больше 20 подсказок)
function addSuggestion(categoryId: string, name: string) {
  return db
    .update(category)
    .set({ suggestions: sql`array_append(${category.suggestions}, ${name})` })
    .where(
      and(
        eq(category.id, categoryId),
        sql`not exists (select 1 from unnest(${category.suggestions}) s where lower(s) = lower(${name}))`,
        sql`coalesce(array_length(${category.suggestions}, 1), 0) < 20`
      )
    );
}

export async function setPlan(input: unknown): Promise<Result> {
  const parsed = setPlanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Проверьте введённые данные' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);
    if (!(await isPlannableCategory(data.householdId, data.categoryId))) {
      return { ok: false, error: 'Категория не найдена' };
    }

    const planId = await findPlanId(data.householdId, data.categoryId, data.month);
    if (planId) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(budgetPlanItem)
        .where(eq(budgetPlanItem.planId, planId));
      if (Number(count) > 0) return { ok: false, error: 'Сумма считается по статьям' };
    }

    await db
      .insert(budgetPlan)
      .values({
        householdId: data.householdId,
        categoryId: data.categoryId,
        month: data.month,
        amount: data.amount,
      })
      .onConflictDoUpdate({
        target: [budgetPlan.categoryId, budgetPlan.month],
        set: { amount: data.amount, updatedAt: new Date() },
      });

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('setPlan failed', error);
    return { ok: false, error: 'Не удалось сохранить план' };
  }
}

export async function removePlan(input: unknown): Promise<Result> {
  const parsed = removePlanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);

    // статьи удаляются каскадом
    await db
      .delete(budgetPlan)
      .where(
        and(
          eq(budgetPlan.householdId, data.householdId),
          eq(budgetPlan.categoryId, data.categoryId),
          eq(budgetPlan.month, data.month)
        )
      );

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('removePlan failed', error);
    return { ok: false, error: 'Не удалось удалить строку плана' };
  }
}

// добавляет статью или меняет сумму существующей (название без учёта регистра)
export async function setPlanItem(input: unknown): Promise<Result> {
  const parsed = setPlanItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Проверьте введённые данные' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);
    if (!(await isPlannableCategory(data.householdId, data.categoryId))) {
      return { ok: false, error: 'Категория не найдена' };
    }

    let planId = await findPlanId(data.householdId, data.categoryId, data.month);
    if (!planId) {
      const [created] = await db
        .insert(budgetPlan)
        .values({
          householdId: data.householdId,
          categoryId: data.categoryId,
          month: data.month,
          amount: data.amount,
        })
        .returning({ id: budgetPlan.id });
      planId = created.id;
    }

    const [existing] = await db
      .select({ id: budgetPlanItem.id })
      .from(budgetPlanItem)
      .where(
        and(
          eq(budgetPlanItem.planId, planId),
          sql`lower(${budgetPlanItem.name}) = lower(${data.name})`
        )
      )
      .limit(1);

    const write = existing
      ? db
          .update(budgetPlanItem)
          .set({ amount: data.amount })
          .where(eq(budgetPlanItem.id, existing.id))
      : db.insert(budgetPlanItem).values({ planId, name: data.name, amount: data.amount });
    await db.batch([write, recomputeAmount(planId), addSuggestion(data.categoryId, data.name)]);

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('setPlanItem failed', error);
    return { ok: false, error: 'Не удалось сохранить статью' };
  }
}

export async function removePlanItem(input: unknown): Promise<Result> {
  const parsed = removePlanItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);

    const planId = await findPlanId(data.householdId, data.categoryId, data.month);
    if (!planId) return { ok: true };

    await db.batch([
      db
        .delete(budgetPlanItem)
        .where(
          and(
            eq(budgetPlanItem.planId, planId),
            sql`lower(${budgetPlanItem.name}) = lower(${data.name})`
          )
        ),
      recomputeAmount(planId),
    ]);

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('removePlanItem failed', error);
    return { ok: false, error: 'Не удалось удалить статью' };
  }
}

// копирует цели вместе со статьями; уже заданные в целевом месяце категории не трогает
export async function copyPlan(input: unknown): Promise<Result> {
  const parsed = copyPlanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);

    // одним запросом: новые планы (только активные категории) и их статьи
    const copied = await db.execute(sql`
      with new_plans as (
        insert into budget_plan (household_id, category_id, month, amount)
        select p.household_id, p.category_id, ${data.toMonth}::date, p.amount
        from budget_plan p
        join category c on c.id = p.category_id
        where p.household_id = ${data.householdId}
          and p.month = ${data.fromMonth}::date
          and c.archived_at is null
        on conflict (category_id, month) do nothing
        returning id, category_id
      ),
      new_items as (
        insert into budget_plan_item (plan_id, name, amount)
        select np.id, i.name, i.amount
        from new_plans np
        join budget_plan op on op.category_id = np.category_id and op.month = ${data.fromMonth}::date
        join budget_plan_item i on i.plan_id = op.id
        returning id
      )
      select id from new_plans
    `);
    if (copied.rows.length === 0)
      return { ok: false, error: 'В прошлом месяце нет плана для копирования' };

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('copyPlan failed', error);
    return { ok: false, error: 'Не удалось скопировать план' };
  }
}
