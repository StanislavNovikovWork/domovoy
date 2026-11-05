import { boolean, date, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { household } from './household';

// списки пространства: покупки и задачи (kind: shopping | tasks)
export const checklist = pgTable(
  'checklist',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => household.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    kind: text('kind').notNull().default('tasks'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('checklist_household_idx').on(t.householdId)]
);

// пункт списка: у покупок quantity, у задач dueDate
export const checklistItem = pgTable(
  'checklist_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listId: uuid('list_id')
      .notNull()
      .references(() => checklist.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    done: boolean('done').notNull().default(false),
    quantity: text('quantity'),
    dueDate: date('due_date', { mode: 'string' }),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('checklist_item_list_idx').on(t.listId)]
);

// заготовки покупок пространства: по клику добавляются в список покупок
export const shoppingPreset = pgTable(
  'shopping_preset',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => household.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    quantity: text('quantity'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('shopping_preset_household_idx').on(t.householdId)]
);
