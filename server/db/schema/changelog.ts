import { date, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// список изменений приложения: одна запись на версию (semver), items — короткие пункты
export const appChangelog = pgTable('app_changelog', {
  id: uuid('id').primaryKey().defaultRandom(),
  version: text('version').notNull().unique(),
  releasedOn: date('released_on', { mode: 'string' }).notNull(),
  items: text('items').array().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
