import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PasswordResetEmailSender } from '../../apps/api/src/features/auth/password-reset-email.js';
import { getTestDatabaseUrl } from './database-test-config.js';
import {
  cleanupMigrationTestDatabases,
  runMigration,
  startMigrationTestDatabase,
  withTestDatabase
} from './database-test-harness.js';

beforeAll(startMigrationTestDatabase);
afterAll(cleanupMigrationTestDatabases);

describe('password reset integration flow', () => {
  it('queues and delivers a code, resets the password, and revokes the session', async () => {
    await withTestDatabase(async (databaseName) => {
      const migrationResult = await runMigration(databaseName);

      expect(
        migrationResult.exitCode,
        `${migrationResult.stdout}\n${migrationResult.stderr}`
      ).toBe(0);

      process.env.DATABASE_URL = getTestDatabaseUrl(databaseName);
      process.env.NODE_ENV = 'test';
      process.env.AUTH_TOKEN_SECRET = 'integration-auth-secret-value-000001';

      const {
        db,
        dbClient,
        passwordResetCodesTable,
        refreshSessionFamiliesTable,
        refreshSessionsTable,
        usersTable
      } = await import('../../packages/db/src/index.js');
      const { hashPassword, verifyPassword } = await import(
        '../../apps/api/src/features/auth/auth.password.js'
      );
      const {
        completePasswordReset,
        requestPasswordReset,
        verifyPasswordResetCode
      } = await import('../../apps/api/src/features/auth/password-reset.service.js');
      const { processPasswordResetEmailJobs } = await import(
        '../../apps/api/src/features/auth/password-reset-email.delivery.js'
      );
      const requestedAt = new Date('2026-08-03T10:00:00.000Z');
      const repeatedAt = new Date('2026-08-03T10:00:00.500Z');
      const verifiedAt = new Date('2026-08-03T10:00:01.000Z');
      const replacementRequestedAt = new Date('2026-08-03T10:00:02.000Z');
      const replacementVerifiedAt = new Date('2026-08-03T10:00:03.000Z');
      const completedAt = new Date('2026-08-03T10:00:04.000Z');
      const deliveredCodes: string[] = [];
      let passwordChangedNoticeCount = 0;
      const sender: PasswordResetEmailSender = {
        sendEmailVerificationCode: async () => undefined,
        sendPasswordResetCode: async (email) => {
          deliveredCodes.push(email.code);
        },
        sendPasswordChangedNotice: async () => {
          passwordChangedNoticeCount += 1;
        }
      };

      try {
        await db.insert(usersTable).values({
          id: 'reset-flow-user',
          email: 'reset-flow@example.com',
          passwordHash: await hashPassword('old-password-value'),
          emailVerifiedAt: requestedAt,
          createdAt: requestedAt
        });
        await db.insert(refreshSessionFamiliesTable).values({
          id: 'reset-flow-family',
          userId: 'reset-flow-user',
          expiresAt: new Date('2026-09-03T10:00:00.000Z'),
          createdAt: requestedAt
        });
        await db.insert(refreshSessionsTable).values({
          id: 'reset-flow-session',
          familyId: 'reset-flow-family',
          userId: 'reset-flow-user',
          tokenHash: 'reset-flow-token-hash',
          expiresAt: new Date('2026-09-03T10:00:00.000Z'),
          createdAt: requestedAt
        });

        const requestResult = await requestPasswordReset(
          { email: 'reset-flow@example.com' },
          '192.0.2.10',
          0,
          requestedAt
        );
        const repeatedRequestResult = await requestPasswordReset(
          { email: 'reset-flow@example.com' },
          '192.0.2.10',
          0,
          repeatedAt
        );
        const missingRequestResult = await requestPasswordReset(
          { email: 'missing-reset-flow@example.com' },
          '192.0.2.11',
          0,
          requestedAt
        );
        const missingRepeatedRequestResult = await requestPasswordReset(
          { email: 'missing-reset-flow@example.com' },
          '192.0.2.11',
          0,
          repeatedAt
        );

        expect(requestResult.expiresAt).toBe('2026-08-03T10:10:00.000Z');
        expect(repeatedRequestResult.expiresAt).toBe('2026-08-03T10:10:00.500Z');
        expect(missingRequestResult).toEqual(requestResult);
        expect(missingRepeatedRequestResult).toEqual(repeatedRequestResult);
        await processPasswordResetEmailJobs(sender, () => verifiedAt);

        const deliveredCode = deliveredCodes[0];

        if (!deliveredCode) {
          throw new Error('Password reset code was not delivered');
        }

        expect(deliveredCodes).toEqual([deliveredCode, deliveredCode]);

        const verificationResult = await verifyPasswordResetCode(
          {
            email: 'reset-flow@example.com',
            code: deliveredCode
          },
          '192.0.2.10',
          verifiedAt
        );

        await requestPasswordReset(
          { email: 'reset-flow@example.com' },
          '192.0.2.10',
          0,
          replacementRequestedAt
        );
        await expect(completePasswordReset({
          resetToken: verificationResult.resetToken,
          password: 'attacker-password-value',
          passwordConfirmation: 'attacker-password-value'
        }, replacementRequestedAt)).rejects.toThrow(
          'Invalid or expired password reset session'
        );
        await processPasswordResetEmailJobs(sender, () => replacementRequestedAt);
        const replacementCode = deliveredCodes[2];

        if (!replacementCode) {
          throw new Error('Replacement password reset code was not delivered');
        }

        const replacementVerification = await verifyPasswordResetCode(
          {
            email: 'reset-flow@example.com',
            code: replacementCode
          },
          '192.0.2.10',
          replacementVerifiedAt
        );

        await completePasswordReset({
          resetToken: replacementVerification.resetToken,
          password: 'new-password-value',
          passwordConfirmation: 'new-password-value'
        }, completedAt);
        await processPasswordResetEmailJobs(sender, () => completedAt);

        const users = await db
          .select({
            authVersion: usersTable.authVersion,
            passwordHash: usersTable.passwordHash
          })
          .from(usersTable);
        const sessions = await db
          .select({ revokedAt: refreshSessionsTable.revokedAt })
          .from(refreshSessionsTable);
        const resetCodes = await db
          .select({ usedAt: passwordResetCodesTable.usedAt })
          .from(passwordResetCodesTable);
        const user = users[0];

        expect(user?.authVersion).toBe(1);
        expect(user?.passwordHash).toBeTruthy();
        expect(await verifyPassword('new-password-value', user?.passwordHash ?? '')).toBe(true);
        expect(sessions[0]?.revokedAt).toEqual(completedAt);
        expect(resetCodes.every((resetCode) => resetCode.usedAt !== null)).toBe(true);
        expect(passwordChangedNoticeCount).toBe(1);
      } finally {
        await dbClient.end();
      }
    });
  });
});
