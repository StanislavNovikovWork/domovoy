import { index, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { household } from './household';

// «Куда сходить»: места, которые предлагают участники пространства
export const place = pgTable(
  'place',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => household.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    // ссылка на место из карт и комментарий (необязательные)
    location: text('location'),
    comment: text('comment'),
    // food | fun | other (shared/config/place-kinds.ts)
    kind: text('kind').notNull().default('other'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('place_household_idx').on(t.householdId)]
);

// лайк места: один на пользователя
export const placeLike = pgTable(
  'place_like',
  {
    placeId: uuid('place_id')
      .notNull()
      .references(() => place.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.placeId, t.userId] })]
);
