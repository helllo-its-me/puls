import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar
} from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: text('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  authVersion: integer('auth_version').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull()
});

export const registrationAttemptsTable = pgTable(
  'registration_attempts',
  {
    id: text('id').primaryKey(),
    registrationTokenHash: text('registration_token_hash').notNull().unique(),
    userId: text('user_id').notNull(),
    profileId: text('profile_id').notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar('last_name', { length: 255 }).notNull(),
    codeHash: text('code_hash').notNull(),
    encryptedCode: text('encrypted_code').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull()
  },
  (table) => [
    index('registration_attempts_email_idx').on(
      table.email.asc().nullsLast().op('text_ops')
    ),
    index('registration_attempts_expires_at_idx').on(
      table.expiresAt.asc().nullsLast().op('timestamptz_ops')
    )
  ]
);

export const profilesTable = pgTable('profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  birthDate: date('birth_date'),
  heightCm: integer('height_cm'),
  weightKg: integer('weight_kg'),
  gender: varchar('gender', { length: 32 }),
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

export const passwordResetCodesTable = pgTable(
  'password_reset_codes',
  {
    id: text('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    codeHash: text('code_hash').notNull(),
    encryptedCode: text('encrypted_code'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    resetTokenHash: text('reset_token_hash'),
    resetTokenExpiresAt: timestamp('reset_token_expires_at', { withTimezone: true }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull()
  },
  (table) => [
    index('password_reset_codes_email_idx').on(
      table.email.asc().nullsLast().op('text_ops')
    ),
    index('password_reset_codes_expires_at_idx').on(
      table.expiresAt.asc().nullsLast().op('timestamptz_ops')
    ),
    index('password_reset_codes_token_expires_at_idx').on(
      table.resetTokenExpiresAt.asc().nullsLast().op('timestamptz_ops')
    ),
    uniqueIndex('password_reset_codes_reset_token_hash_idx').on(
      table.resetTokenHash.asc().nullsLast().op('text_ops')
    )
  ]
);

export const passwordResetEmailJobsTable = pgTable(
  'password_reset_email_jobs',
  {
    id: text('id').primaryKey(),
    kind: varchar('kind', { length: 32 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    encryptedCode: text('encrypted_code'),
    codeExpiresAt: timestamp('code_expires_at', { withTimezone: true }),
    attempts: integer('attempts').notNull().default(0),
    availableAt: timestamp('available_at', { withTimezone: true }).notNull(),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull()
  },
  (table) => [
    index('password_reset_email_jobs_pending_idx').on(
      table.availableAt.asc().nullsLast().op('timestamptz_ops')
    )
  ]
);

export const refreshSessionFamiliesTable = pgTable(
  'refresh_session_families',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull()
  },
  (table) => [
    index('refresh_session_families_expires_at_idx').on(
      table.expiresAt.asc().nullsLast().op('timestamptz_ops')
    )
  ]
);

export const refreshSessionsTable = pgTable(
  'refresh_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    familyId: text('family_id')
      .notNull()
      .references(() => refreshSessionFamiliesTable.id, { onDelete: 'cascade' }),
    authVersion: integer('auth_version').notNull().default(0),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull()
  },
  (table) => [
    index('refresh_sessions_family_id_idx').on(
      table.familyId.asc().nullsLast().op('text_ops')
    ),
    index('refresh_sessions_expires_at_idx').on(
      table.expiresAt.asc().nullsLast().op('timestamptz_ops')
    )
  ]
);

export const authRateLimitsTable = pgTable(
  'auth_rate_limits',
  {
    key: text('key').primaryKey(),
    attempts: integer('attempts').notNull(),
    windowStartedAt: timestamp('window_started_at', { withTimezone: true }).notNull()
  },
  (table) => [
    index('auth_rate_limits_window_started_at_idx').on(
      table.windowStartedAt.asc().nullsLast().op('timestamptz_ops')
    )
  ]
);

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
