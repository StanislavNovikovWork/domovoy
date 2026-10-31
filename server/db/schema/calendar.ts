import { date, index, pgTable, text, time, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './auth';
import { household } from './household';

// события календаря пространства: название и дата
export const calendarEvent = pgTable(
  'calendar_event',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => household.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    // YYYY-MM-DD без времени: событие на весь день
    eventDate: date('event_date', { mode: 'string' }).notNull(),
    // необязательное время начала HH:MM:SS
    eventTime: time('event_time'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('calendar_event_household_idx').on(t.householdId)]
);
