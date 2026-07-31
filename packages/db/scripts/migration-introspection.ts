import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { getMigrationSnapshotPath } from './migration-paths.js';
import { areMigrationSnapshotsEquivalent } from './migration-snapshot.js';
import { runDrizzleKit } from './run-drizzle-kit.js';

interface MigrationSnapshotExpectation {
  databaseUrl: string;
  migrationIndex: number;
  mismatchMessage: string;
}

export async function assertDatabaseSchemaMatchesMigrationSnapshot(
  expectation: MigrationSnapshotExpectation
): Promise<void> {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'puls-drizzle-introspection-'));

  try {
    await runDrizzleKit(['pull', '--config=drizzle.introspection.config.ts'], {
      DATABASE_URL: expectation.databaseUrl,
      DRIZZLE_INTROSPECTION_OUTPUT: temporaryDirectory
    });

    const [expectedSnapshotContent, actualSnapshotContent] = await Promise.all([
      readFile(getMigrationSnapshotPath(expectation.migrationIndex), 'utf8'),
      readFile(resolve(temporaryDirectory, 'meta/0000_snapshot.json'), 'utf8')
    ]);
    const expectedSnapshot: unknown = JSON.parse(expectedSnapshotContent);
    const actualSnapshot: unknown = JSON.parse(actualSnapshotContent);

    if (!areMigrationSnapshotsEquivalent(actualSnapshot, expectedSnapshot)) {
      throw new Error(expectation.mismatchMessage);
    }
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
}
