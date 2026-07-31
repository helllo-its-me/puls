import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

import { db, dbClient } from '../src/client.js';
import { getDatabaseUrl } from '../src/database-url.js';
import {
  migrationsLockName,
  migrationsSchema,
  migrationsTable
} from '../src/migration-config.js';
import { ensureInitialMigrationBaseline } from './migration-baseline.js';
import { migrationsDirectory } from './migration-paths.js';

async function main(): Promise<void> {
  const lockClient = postgres(getDatabaseUrl(), { max: 1 });
  const lockConnection = await lockClient.reserve();
  let lockAcquired = false;

  try {
    await lockConnection`
      SELECT pg_advisory_lock(hashtext(${migrationsLockName}), hashtext(current_database()))
    `;
    lockAcquired = true;

    await ensureInitialMigrationBaseline(dbClient);
    await migrate(db, {
      migrationsFolder: migrationsDirectory,
      migrationsSchema,
      migrationsTable
    });
  } finally {
    try {
      if (lockAcquired) {
        await lockConnection`
          SELECT pg_advisory_unlock(hashtext(${migrationsLockName}), hashtext(current_database()))
        `;
      }
    } finally {
      lockConnection.release();
      await lockClient.end();
      await dbClient.end();
    }
  }
}

void main();
