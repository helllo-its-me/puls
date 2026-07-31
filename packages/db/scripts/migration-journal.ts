import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { migrationsDirectory } from './migration-paths.js';
import { isRecord } from './unknown-value.js';

export interface MigrationJournalEntry {
  idx: number;
  tag: string;
  when: number;
}

function parseMigrationJournalEntry(value: unknown): MigrationJournalEntry {
  if (
    !isRecord(value)
    || typeof value.idx !== 'number'
    || !Number.isInteger(value.idx)
    || value.idx < 0
    || typeof value.tag !== 'string'
    || value.tag.length === 0
    || typeof value.when !== 'number'
    || !Number.isInteger(value.when)
    || value.when < 0
  ) {
    throw new Error('Migration journal contains an invalid entry');
  }

  return {
    idx: value.idx,
    tag: value.tag,
    when: value.when
  };
}

export async function readMigrationJournal(): Promise<MigrationJournalEntry[]> {
  const journalContent = await readFile(resolve(migrationsDirectory, 'meta/_journal.json'), 'utf8');
  const journalJson: unknown = JSON.parse(journalContent);

  if (!isRecord(journalJson) || !Array.isArray(journalJson.entries)) {
    throw new Error('Migration journal has an invalid structure');
  }

  const journalEntries: unknown[] = journalJson.entries;

  return journalEntries.map(parseMigrationJournalEntry);
}

export function getLatestMigration(
  migrationJournal: readonly MigrationJournalEntry[]
): MigrationJournalEntry {
  const [firstMigration, ...remainingMigrations] = migrationJournal;

  if (!firstMigration) {
    throw new Error('Migration journal does not contain any migrations');
  }

  return remainingMigrations.reduce(
    (latestEntry, currentEntry) => currentEntry.idx > latestEntry.idx ? currentEntry : latestEntry,
    firstMigration
  );
}
