import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  getLatestMigration,
  readMigrationJournal
} from '../../packages/db/scripts/migration-journal.js';
import { migrationsQualifiedTable } from '../../packages/db/src/migration-config.js';
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
});
