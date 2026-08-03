import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  getLatestMigration,
  readMigrationJournal
} from '../../packages/db/scripts/migration-journal.js';
import { migrationsQualifiedTable } from '../../packages/db/src/migration-config.js';
import { getTestDatabaseUrl } from './database-test-config.js';
import {
  assertMigratedSchemaMatchesSnapshot,
  cleanupMigrationTestDatabases,
  type ProcessResult,
  queryScalar,
  runLegacySchemaPush,
  runMigration,
  runSql,
  startMigrationTestDatabase,
  withTestDatabase
} from './database-test-harness.js';

let expectedMigrationCount = 0;
let latestMigrationIndex = 0;

function assertSuccessful(result: ProcessResult): void {
  expect(result.exitCode, `${result.stdout}\n${result.stderr}`).toBe(0);
}

beforeAll(async () => {
  await startMigrationTestDatabase();
  const migrationJournal = await readMigrationJournal();
  expectedMigrationCount = migrationJournal.length;
  latestMigrationIndex = getLatestMigration(migrationJournal).idx;
});

afterAll(cleanupMigrationTestDatabases);

describe('database migration workflow', () => {
  it('migrates a fresh database and remains idempotent', async () => {
    await withTestDatabase(async (databaseName) => {
      const firstResult = await runMigration(databaseName);
      assertSuccessful(firstResult);

      await assertMigratedSchemaMatchesSnapshot(databaseName, latestMigrationIndex);

      const secondResult = await runMigration(databaseName);
      assertSuccessful(secondResult);
      await expect(
        queryScalar(databaseName, `SELECT COUNT(*) FROM ${migrationsQualifiedTable};`)
      ).resolves.toBe(expectedMigrationCount.toString());
    });
  });

  it('baselines a database created by drizzle-kit push without losing data', async () => {
    await withTestDatabase(async (databaseName) => {
      const legacyUserId = 'legacy-user';
      const pushResult = await runLegacySchemaPush(databaseName);
      const prepareResult = await runSql(
        databaseName,
        `INSERT INTO users (id, email, created_at) VALUES ('${legacyUserId}', 'legacy@example.com', NOW());`
      );
      assertSuccessful(pushResult);
      assertSuccessful(prepareResult);

      const migrationResult = await runMigration(databaseName);

      assertSuccessful(migrationResult);
      await expect(
        queryScalar(databaseName, `SELECT COUNT(*) FROM users WHERE id = '${legacyUserId}';`)
      ).resolves.toBe('1');
      await expect(
        queryScalar(databaseName, `SELECT COUNT(*) FROM ${migrationsQualifiedTable};`)
      ).resolves.toBe(expectedMigrationCount.toString());
    });
  });

  it('rejects a pushed database whose schema has drifted', async () => {
    await withTestDatabase(async (databaseName) => {
      const pushResult = await runLegacySchemaPush(databaseName);
      const prepareResult = await runSql(
        databaseName,
        'ALTER TABLE users ADD COLUMN unexpected_column text;'
      );
      assertSuccessful(pushResult);
      assertSuccessful(prepareResult);

      const migrationResult = await runMigration(databaseName);

      expect(migrationResult.exitCode).not.toBe(0);
      expect(`${migrationResult.stdout}\n${migrationResult.stderr}`).toContain(
        'does not match the initial migration'
      );
      await expect(
        queryScalar(databaseName, `SELECT to_regclass('${migrationsQualifiedTable}') IS NULL;`)
      ).resolves.toBe('t');
    });
  });

  it('serializes concurrent migration runs', async () => {
    await withTestDatabase(async (databaseName) => {
      const [firstResult, secondResult] = await Promise.all([
        runMigration(databaseName),
        runMigration(databaseName)
      ]);

      assertSuccessful(firstResult);
      assertSuccessful(secondResult);
      await expect(
        queryScalar(databaseName, `SELECT COUNT(*) FROM ${migrationsQualifiedTable};`)
      ).resolves.toBe(expectedMigrationCount.toString());
    });
  });

  it('atomically consumes a password reset token and revokes every auth session', async () => {
    await withTestDatabase(async (databaseName) => {
      const migrationResult = await runMigration(databaseName);
      assertSuccessful(migrationResult);
      process.env.DATABASE_URL = getTestDatabaseUrl(databaseName);

      const {
        db,
        dbClient,
        passwordResetEmailJobsTable,
        passwordResetCodesTable,
        refreshSessionFamiliesTable,
        refreshSessionsTable,
        usersTable
      } = await import('../../packages/db/src/index.js');
      const { completePasswordResetByTokenHash } = await import(
        '../../apps/api/src/features/auth/password-reset.repository.js'
      );
      const { incrementAuthRateLimit } = await import(
        '../../apps/api/src/features/auth/auth.rate-limit.repository.js'
      );
      const now = new Date('2026-08-01T10:00:00.000Z');

      try {
        await db.insert(usersTable).values({
          id: 'security-test-user',
          email: 'security-test@example.com',
          passwordHash: 'old-password-hash',
          createdAt: now
        });
        await db.insert(refreshSessionFamiliesTable).values({
          id: 'security-test-refresh-family',
          userId: 'security-test-user',
          expiresAt: new Date('2099-01-01T00:00:00.000Z'),
          createdAt: now
        });
        await db.insert(refreshSessionsTable).values({
          id: 'security-test-refresh-session',
          familyId: 'security-test-refresh-family',
          userId: 'security-test-user',
          tokenHash: 'security-test-refresh-token-hash',
          expiresAt: new Date('2099-01-01T00:00:00.000Z'),
          createdAt: now
        });
        await db.insert(passwordResetCodesTable).values({
          id: 'security-test-reset-code',
          email: 'security-test@example.com',
          codeHash: 'security-test-code-hash',
          expiresAt: new Date('2099-01-01T00:00:00.000Z'),
          resetTokenHash: 'security-test-reset-token-hash',
          resetTokenExpiresAt: new Date('2099-01-01T00:00:00.000Z'),
          verifiedAt: now,
          createdAt: now
        });

        const firstRateLimit = await incrementAuthRateLimit(
          'security-test-rate-limit',
          now,
          new Date('2026-08-01T09:45:00.000Z')
        );
        const secondRateLimit = await incrementAuthRateLimit(
          'security-test-rate-limit',
          new Date('2026-08-01T10:01:00.000Z'),
          new Date('2026-08-01T09:46:00.000Z')
        );

        const completionResults = await Promise.all([
          completePasswordResetByTokenHash(
            'security-test-reset-token-hash',
            'first-new-password-hash',
            'first-password-changed-email-job',
            now
          ),
          completePasswordResetByTokenHash(
            'security-test-reset-token-hash',
            'second-new-password-hash',
            'second-password-changed-email-job',
            now
          )
        ]);
        const users = await db
          .select({
            authVersion: usersTable.authVersion,
            passwordHash: usersTable.passwordHash
          })
          .from(usersTable);
        const refreshSessions = await db
          .select({
            authVersion: refreshSessionsTable.authVersion,
            revokedAt: refreshSessionsTable.revokedAt
          })
          .from(refreshSessionsTable);
        const passwordChangedEmailJobs = await db
          .select({ id: passwordResetEmailJobsTable.id })
          .from(passwordResetEmailJobsTable);

        expect(completionResults.filter(Boolean)).toHaveLength(1);
        expect(firstRateLimit.attempts).toBe(1);
        expect(secondRateLimit.attempts).toBe(2);
        expect(users[0]?.authVersion).toBe(1);
        expect(users[0]?.passwordHash).toMatch(/^(first|second)-new-password-hash$/);
        expect(refreshSessions[0]?.revokedAt).toEqual(now);
        expect(passwordChangedEmailJobs).toHaveLength(1);

        await db.insert(refreshSessionFamiliesTable).values({
          id: 'expired-refresh-family',
          userId: 'security-test-user',
          expiresAt: new Date('2026-07-31T00:00:00.000Z'),
          createdAt: new Date('2026-07-01T00:00:00.000Z')
        });
        await db.insert(refreshSessionsTable).values({
          id: 'expired-refresh-session',
          familyId: 'expired-refresh-family',
          userId: 'security-test-user',
          authVersion: 0,
          tokenHash: 'expired-refresh-token-hash',
          expiresAt: new Date('2026-07-31T00:00:00.000Z'),
          createdAt: new Date('2026-07-01T00:00:00.000Z')
        });

        await db.insert(refreshSessionFamiliesTable).values({
          id: 'late-stale-refresh-family',
          userId: 'security-test-user',
          expiresAt: new Date('2099-01-01T00:00:00.000Z'),
          createdAt: now
        });
        await db.insert(refreshSessionsTable).values({
          id: 'late-stale-refresh-session',
          familyId: 'late-stale-refresh-family',
          userId: 'security-test-user',
          authVersion: 0,
          tokenHash: 'late-stale-refresh-token-hash',
          expiresAt: new Date('2099-01-01T00:00:00.000Z'),
          createdAt: now
        });

        const { rotateRefreshSession } = await import(
          '../../apps/api/src/features/auth/auth.repository.js'
        );
        const staleRotation = await rotateRefreshSession(
          'late-stale-refresh-token-hash',
          {
            id: 'revived-refresh-session',
            tokenHash: 'revived-refresh-token-hash',
            expiresAt: new Date('2099-01-01T00:00:00.000Z'),
            createdAt: now
          },
          now
        );

        expect(staleRotation).toBeNull();
        await expect(
          queryScalar(
            databaseName,
            "SELECT COUNT(*) FROM refresh_sessions WHERE token_hash = 'expired-refresh-token-hash';"
          )
        ).resolves.toBe('0');
        await expect(
          queryScalar(
            databaseName,
            "SELECT COUNT(*) FROM refresh_sessions WHERE token_hash = 'revived-refresh-token-hash';"
          )
        ).resolves.toBe('0');

        await db.insert(refreshSessionFamiliesTable).values({
          id: 'replay-session-family',
          userId: 'security-test-user',
          expiresAt: new Date('2099-01-01T00:00:00.000Z'),
          createdAt: now
        });
        await db.insert(refreshSessionsTable).values({
          id: 'replay-source-session',
          familyId: 'replay-session-family',
          userId: 'security-test-user',
          authVersion: 1,
          tokenHash: 'replay-source-token-hash',
          expiresAt: new Date('2099-01-01T00:00:00.000Z'),
          createdAt: now
        });

        const replayResults = await Promise.all([
          rotateRefreshSession(
            'replay-source-token-hash',
            {
              id: 'replay-child-session',
              tokenHash: 'replay-child-token-hash',
              expiresAt: new Date('2099-01-01T00:00:00.000Z'),
              createdAt: now
            },
            now
          ),
          rotateRefreshSession(
            'replay-source-token-hash',
            {
              id: 'replay-attacker-session',
              tokenHash: 'replay-attacker-token-hash',
              expiresAt: new Date('2099-01-01T00:00:00.000Z'),
              createdAt: now
            },
            now
          )
        ]);

        expect(replayResults.filter(Boolean)).toHaveLength(1);
        await expect(
          queryScalar(
            databaseName,
            "SELECT COUNT(*) FROM refresh_sessions WHERE family_id = 'replay-session-family' AND id <> 'replay-source-session' AND revoked_at IS NOT NULL;"
          )
        ).resolves.toBe('1');
      } finally {
        await dbClient.end();
      }
    });
  });
});
