import { sql } from 'drizzle-orm';
import { pgTable, uuid, text, bigint, date, timestamp, index, check } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { category } from './category';
import { household } from './household';

export const transaction = pgTable(
  'transaction',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => household.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => category.id, { onDelete: 'restrict' }),
    // сумма в копейках, всегда положительная; доход или расход определяется типом категории
    amount: bigint('amount', { mode: 'number' }).notNull(),
    occurredOn: date('occurred_on', { mode: 'string' }).notNull(),
    note: text('note'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('transaction_household_date_idx').on(t.householdId, t.occurredOn),
    index('transaction_category_idx').on(t.categoryId),
    check('transaction_amount_positive', sql`${t.amount} > 0`),
  ]
);
