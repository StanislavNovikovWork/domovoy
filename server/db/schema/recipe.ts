import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { household } from './household';

export type RecipeIngredient = { name: string; quantity: string | null };

// рецепты «Меню» пространства; ингредиенты хранятся массивом
export const recipe = pgTable(
  'recipe',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => household.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    photoId: uuid('photo_id'),
    ingredients: jsonb('ingredients').$type<RecipeIngredient[]>().notNull().default([]),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('recipe_household_idx').on(t.householdId)]
);
