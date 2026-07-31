import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type postgres from 'postgres';

import { getDatabaseUrl } from '../src/database-url.js';
import {
  migrationsQualifiedTable,
  migrationsSchema,
  migrationsTable
} from '../src/migration-config.js';
import { assertDatabaseSchemaMatchesMigrationSnapshot } from './migration-introspection.js';
import { readMigrationJournal } from './migration-journal.js';
import { migrationsDirectory } from './migration-paths.js';

async function readInitialMigration(): Promise<{ hash: string; createdAt: number }> {
  const migrationJournal = await readMigrationJournal();
  const initialMigration = migrationJournal.find(({ idx }) => idx === 0);

  if (!initialMigration) {
    throw new Error('Initial migration is missing from the migration journal');
  }

  const migrationSql = await readFile(resolve(migrationsDirectory, `${initialMigration.tag}.sql`), 'utf8');

  return {
    hash: createHash('sha256').update(migrationSql).digest('hex'),
    createdAt: initialMigration.when
  };
}

async function hasAppliedMigrations(transaction: postgres.TransactionSql): Promise<boolean> {
  const [migrationTable] = await transaction<{ migrationTable: string | null }[]>`
    SELECT to_regclass(${migrationsQualifiedTable})::text AS "migrationTable"
  `;

  if (!migrationTable?.migrationTable) {
    return false;
  }

  const [migrationCount] = await transaction<{ count: number }[]>`
    SELECT count(*)::integer AS count
    FROM ${transaction(migrationsSchema)}.${transaction(migrationsTable)}
  `;

  return (migrationCount?.count ?? 0) > 0;
}

async function hasExistingPublicTables(transaction: postgres.TransactionSql): Promise<boolean> {
  const [tableCount] = await transaction<{ count: number }[]>`
    SELECT count(*)::integer AS count
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
  `;

  return (tableCount?.count ?? 0) > 0;
}

export async function ensureInitialMigrationBaseline(databaseClient: postgres.Sql): Promise<void> {
  await databaseClient.begin(async (transaction) => {
    if (await hasAppliedMigrations(transaction)) {
      return;
    }

    if (!(await hasExistingPublicTables(transaction))) {
      return;
    }

    await assertDatabaseSchemaMatchesMigrationSnapshot({
      databaseUrl: getDatabaseUrl(),
      migrationIndex: 0,
      mismatchMessage:
        'Existing database schema does not match the initial migration snapshot. Baseline was not recorded.'
    });
    const initialMigration = await readInitialMigration();

    await transaction`CREATE SCHEMA IF NOT EXISTS ${transaction(migrationsSchema)}`;
    await transaction`
      CREATE TABLE IF NOT EXISTS ${transaction(migrationsSchema)}.${transaction(migrationsTable)} (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `;
    await transaction`
      INSERT INTO ${transaction(migrationsSchema)}.${transaction(migrationsTable)} (hash, created_at)
      VALUES (${initialMigration.hash}, ${initialMigration.createdAt})
    `;

    console.log('Existing database schema matches the initial migration and was safely baselined.');
  });
}
