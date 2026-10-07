// server/db/schema/household.ts
import { pgEnum, pgTable, uuid, text, timestamp, primaryKey, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';

export const householdType = pgEnum('household_type', ['personal', 'family']);
export const householdRole = pgEnum('household_role', ['owner', 'member']);

export const household = pgTable('household', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: householdType('type').notNull(),
  createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // не более одного личного household на пользователя
  uniqueIndex('household_one_personal_per_user')
    .on(t.createdBy)
    .where(sql`${t.type} = 'personal'`),
]);

export const householdMember = pgTable('household_member', {
  householdId: uuid('household_id').notNull().references(() => household.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: householdRole('role').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.householdId, t.userId] }),
  index('household_member_user_idx').on(t.userId),
]);

// одноразовая ссылка-приглашение; активна, пока не использована, не отозвана и не истекла
export const householdInvite = pgTable('household_invite', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id').notNull().references(() => household.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  createdBy: text('created_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedBy: text('used_by').references(() => user.id, { onDelete: 'set null' }),
  usedAt: timestamp('used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('household_invite_token_idx').on(t.token),
  index('household_invite_household_idx').on(t.householdId),
]);