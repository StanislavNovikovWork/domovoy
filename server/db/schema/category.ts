import { pgEnum, pgTable, uuid, text, integer, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { household } from './household';

export const categoryType = pgEnum('category_type', ['income', 'expense']);

export const category = pgTable('category', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => household.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: categoryType('type').notNull(),
  icon: text('icon').notNull().default('tag'),
  color: text('color').notNull().default('gray'),
  sortOrder: integer('sort_order').notNull().default(0),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('category_household_idx').on(t.householdId),
  // имя уникально среди активных категорий; архивные не мешают создать такую же заново
  uniqueIndex('category_unique_active_name')
    .on(t.householdId, t.type, t.name)
    .where(sql`${t.archivedAt} is null`),
]);