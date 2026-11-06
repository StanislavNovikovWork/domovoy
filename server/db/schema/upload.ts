import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { household } from './household';

// загруженные фото: kind = avatar | recipe; у аватарок householdId пустой и квота не считается
export const upload = pgTable(
  'upload',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id').references(() => household.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    size: integer('size').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('upload_household_idx').on(t.householdId)]
);
