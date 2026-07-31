import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { getLatestMigration, readMigrationJournal } from './migration-journal.js';
import { getMigrationSnapshotPath } from './migration-paths.js';
import { areMigrationSnapshotsEquivalent } from './migration-snapshot.js';
import { runDrizzleKit } from './run-drizzle-kit.js';

async function main(): Promise<void> {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'puls-drizzle-schema-check-'));

  try {
    const migrationJournal = await readMigrationJournal();
    const latestMigration = getLatestMigration(migrationJournal);

    await runDrizzleKit(['generate', '--config=drizzle.schema-check.config.ts'], {
      DRIZZLE_SCHEMA_CHECK_OUTPUT: temporaryDirectory
    });

    const [committedSnapshotContent, currentSchemaSnapshotContent] = await Promise.all([
      readFile(getMigrationSnapshotPath(latestMigration.idx), 'utf8'),
      readFile(resolve(temporaryDirectory, 'meta/0000_snapshot.json'), 'utf8')
    ]);
    const committedSnapshot: unknown = JSON.parse(committedSnapshotContent);
    const currentSchemaSnapshot: unknown = JSON.parse(currentSchemaSnapshotContent);

    if (!areMigrationSnapshotsEquivalent(currentSchemaSnapshot, committedSnapshot)) {
      throw new Error(
        'Database schema differs from the latest migration snapshot. Run pnpm db:generate and commit the migration.'
      );
    }

    console.log('Database schema matches the latest migration snapshot.');
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
}

void main();
