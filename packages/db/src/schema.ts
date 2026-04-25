import { integer, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const profilesTable = pgTable('profiles', {
  id: text('id').primaryKey(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  membershipTier: varchar('membership_tier', { length: 255 }).notNull(),
  planTitle: varchar('plan_title', { length: 255 }).notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull(),
  nextSessionAt: timestamp('next_session_at', { withTimezone: true }).notNull(),
  streakDays: integer('streak_days').notNull(),
  completionPercent: integer('completion_percent').notNull(),
  energyLabel: varchar('energy_label', { length: 255 }).notNull(),
  consistencyNote: text('consistency_note').notNull(),
  supportNote: text('support_note').notNull()
});

export const profileFocusAreasTable = pgTable('profile_focus_areas', {
  id: text('id').primaryKey(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profilesTable.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 255 }).notNull(),
  progressLabel: varchar('progress_label', { length: 255 }).notNull(),
  position: integer('position').notNull()
});

export const profileHighlightsTable = pgTable('profile_highlights', {
  id: text('id').primaryKey(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profilesTable.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  position: integer('position').notNull()
});

export const profileQuickActionsTable = pgTable('profile_quick_actions', {
  id: text('id').primaryKey(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profilesTable.id, { onDelete: 'cascade' }),
  label: varchar('label', { length: 255 }).notNull(),
  description: text('description').notNull(),
  accent: varchar('accent', { length: 32 }).notNull(),
  position: integer('position').notNull()
});
