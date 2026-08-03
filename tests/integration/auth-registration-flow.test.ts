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

describe('registration integration flow', () => {
  it('requires mailbox ownership before login', async () => {
    await withTestDatabase(async (databaseName) => {
      const migrationResult = await runMigration(databaseName);

      expect(
        migrationResult.exitCode,
        `${migrationResult.stdout}\n${migrationResult.stderr}`
      ).toBe(0);

      process.env.DATABASE_URL = getTestDatabaseUrl(databaseName);
      process.env.NODE_ENV = 'test';
      process.env.AUTH_TOKEN_SECRET = 'integration-auth-secret-value-000001';

      const { dbClient } = await import('../../packages/db/src/index.js');
      const { loginUser } = await import(
        '../../apps/api/src/features/auth/auth.service.js'
      );
      const {
        registerUser,
        verifyRegisteredEmail
      } = await import('../../apps/api/src/features/auth/registration.service.js');
      const { processPasswordResetEmailJobs } = await import(
        '../../apps/api/src/features/auth/password-reset-email.delivery.js'
      );
      const registeredAt = new Date('2026-08-03T11:00:00.000Z');
      const deliveredCodes: string[] = [];
      const sender: PasswordResetEmailSender = {
        sendEmailVerificationCode: async (email) => {
          deliveredCodes.push(email.code);
        },
        sendPasswordResetCode: async () => undefined,
        sendPasswordChangedNotice: async () => undefined
      };
      const ownerCredentials = {
        email: 'registration-flow@example.com',
        password: 'strong-password-value'
      };
      const attackerCredentials = {
        email: ownerCredentials.email,
        password: 'attacker-password-value'
      };

      try {
        const originalRegistration = await registerUser({
          ...ownerCredentials,
          firstName: 'Registration',
          lastName: 'Flow'
        }, '192.0.2.20', 0, registeredAt);

        await expect(
          loginUser(ownerCredentials, '192.0.2.20')
        ).rejects.toThrow('Invalid email or password');

        await processPasswordResetEmailJobs(sender, () => registeredAt);
        const originalCode = deliveredCodes[0];

        if (!originalCode) {
          throw new Error('Email verification code was not delivered');
        }

        await registerUser({
          ...attackerCredentials,
          firstName: 'Attacker',
          lastName: 'Attempt'
        }, '192.0.2.21', 0, new Date('2026-08-03T11:00:01.000Z'));

        await expect(verifyRegisteredEmail({
          email: ownerCredentials.email,
          code: originalCode,
          registrationToken: originalRegistration.registrationToken
        }, '192.0.2.20', new Date('2026-08-03T11:00:02.000Z'))).rejects.toThrow(
          'Invalid or expired email verification code'
        );

        const recoveryRegistration = await registerUser({
          ...ownerCredentials,
          firstName: 'Registration',
          lastName: 'Flow'
        }, '192.0.2.20', 0, new Date('2026-08-03T11:00:03.000Z'));
        await processPasswordResetEmailJobs(
          sender,
          () => new Date('2026-08-03T11:00:03.000Z')
        );
        const recoveryCode = deliveredCodes[2];

        if (!recoveryCode) {
          throw new Error('Recovery email verification code was not delivered');
        }

        await verifyRegisteredEmail({
          email: ownerCredentials.email,
          code: recoveryCode,
          registrationToken: recoveryRegistration.registrationToken
        }, '192.0.2.20', new Date('2026-08-03T11:00:04.000Z'));

        await expect(
          loginUser(ownerCredentials, '192.0.2.20')
        ).resolves.toMatchObject({
          user: { email: ownerCredentials.email }
        });
        await expect(
          loginUser(attackerCredentials, '192.0.2.21')
        ).rejects.toThrow('Invalid email or password');
      } finally {
        await dbClient.end();
      }
    });
  });
});
