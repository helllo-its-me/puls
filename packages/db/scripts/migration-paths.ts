import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const databasePackageRoot = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
export const migrationsDirectory = resolve(databasePackageRoot, 'migrations');

export function getMigrationSnapshotPath(migrationIndex: number): string {
  const snapshotFileName = `${String(migrationIndex).padStart(4, '0')}_snapshot.json`;

  return resolve(migrationsDirectory, 'meta', snapshotFileName);
}
