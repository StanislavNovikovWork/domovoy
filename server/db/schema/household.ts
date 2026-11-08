import { sql } from 'drizzle-orm';
// server/db/schema/household.ts
import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

// periodic: учёт по дням, неделям, месяцам; one_time: разовый (поездка, ремонт) без периодов
export const householdKind = pgEnum('household_kind', ['periodic', 'one_time']);
export const householdRole = pgEnum('household_role', ['owner', 'member']);

export const household = pgTable(
  'household',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    // иконка пространства из SPACE_ICONS (shared/config/space-icons); null — без иконки
    icon: text('icon'),
    kind: householdKind('kind').notNull().default('periodic'),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // проект: дочерний бюджет внутри другого пространства (удаляется вместе с родителем)
    parentId: uuid('parent_id').references((): AnyPgColumn => household.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

export const householdMember = pgTable(
  'household_member',
  {
    householdId: uuid('household_id')
      .notNull()
      .references(() => household.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: householdRole('role').notNull(),
    // наблюдатель: не участвует в долях расходов; включает владелец или сам участник
    observer: boolean('observer').notNull().default(false),
    // плитки мобильного рабочего стола, скрытые этим участником (личная настройка)
    hiddenTiles: jsonb('hidden_tiles').$type<string[]>().notNull().default([]),
    // порядок плиток мобильного рабочего стола этого участника (личная настройка)
    tileOrder: jsonb('tile_order').$type<string[]>().notNull().default([]),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.householdId, t.userId] }),
    index('household_member_user_idx').on(t.userId),
  ]
);

// участник без аккаунта: вписан по имени, участвует в расходах, но в приложение не заходит
export const householdGuest = pgTable(
  'household_guest',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => household.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // имя уникально внутри бюджета без учёта регистра
    uniqueIndex('household_guest_name_idx').on(t.householdId, sql`lower(${t.name})`),
  ]
);

// одноразовая ссылка-приглашение; активна, пока не использована, не отозвана и не истекла
export const householdInvite = pgTable(
  'household_invite',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => household.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedBy: text('used_by').references(() => user.id, { onDelete: 'set null' }),
    usedAt: timestamp('used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('household_invite_token_idx').on(t.token),
    index('household_invite_household_idx').on(t.householdId),
  ]
);
