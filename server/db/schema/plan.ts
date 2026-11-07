import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  bigint,
  date,
  timestamp,
  index,
  uniqueIndex,
  check,
  jsonb,
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { category } from './category';
import { household } from './household';

// плановые траты по категории на месяц
export const budgetPlan = pgTable(
  'budget_plan',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => household.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => category.id, { onDelete: 'cascade' }),
    // первое число месяца, 'YYYY-MM-01'
    month: date('month', { mode: 'string' }).notNull(),
    // копейки; 0 = категория добавлена в план, но сумма ещё не задана (например, пока не расписаны статьи)
    amount: bigint('amount', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('budget_plan_category_month_idx').on(t.categoryId, t.month),
    index('budget_plan_household_month_idx').on(t.householdId, t.month),
    check('budget_plan_amount_nonnegative', sql`${t.amount} >= 0`),
  ]
);

// статьи плана категории (мобильная связь, VPN, ипотека...); если они есть,
// budget_plan.amount равен их сумме
export const budgetPlanItem = pgTable(
  'budget_plan_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => budgetPlan.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    // копейки, всегда положительная
    amount: bigint('amount', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // название уникально внутри плана без учёта регистра
    uniqueIndex('budget_plan_item_name_idx').on(t.planId, sql`lower(${t.name})`),
    check('budget_plan_item_amount_positive', sql`${t.amount} > 0`),
  ]
);

// связь «проект ↔ статья плана»: факт статьи считается из долей выбранных участников проекта,
// транзакции не копируются; пространство-получатель видит только сумму
export const planProjectLink = pgTable(
  'plan_project_link',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planItemId: uuid('plan_item_id')
      .notNull()
      .references(() => budgetPlanItem.id, { onDelete: 'cascade' }),
    // проект — дочернее пространство (household.parent_id)
    projectId: uuid('project_id')
      .notNull()
      .references(() => household.id, { onDelete: 'cascade' }),
    // пространство, чей план получает факт
    householdId: uuid('household_id')
      .notNull()
      .references(() => household.id, { onDelete: 'cascade' }),
    // участники проекта, чьи доли идут в факт: userId членов и имена гостей
    memberIds: jsonb('member_ids').$type<string[]>().notNull().default([]),
    guestNames: jsonb('guest_names').$type<string[]>().notNull().default([]),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('plan_project_link_item_idx').on(t.planItemId),
    index('plan_project_link_household_idx').on(t.householdId),
    index('plan_project_link_project_idx').on(t.projectId),
  ]
);
