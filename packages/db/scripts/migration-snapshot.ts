import { isDeepStrictEqual } from 'node:util';

import { isRecord } from './unknown-value.js';

function isRecursivelyEmpty(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every((nestedValue) => isRecord(nestedValue) && isRecursivelyEmpty(nestedValue));
}

function normalizeSnapshot(value: unknown, depth = 0): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeSnapshot(item, depth + 1));
  }

  if (!isRecord(value)) {
    return value;
  }

  const normalizedEntries = Object.entries(value)
    .filter(([key, nestedValue]) => {
      if (depth === 0 && (key === 'id' || key === 'prevId')) {
        return false;
      }

      if (depth === 0 && key === 'internal' && isRecursivelyEmpty(nestedValue)) {
        return false;
      }

      return !(key === 'schemaTo' && nestedValue === 'public');
    })
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, nestedValue]) => [key, normalizeSnapshot(nestedValue, depth + 1)]);

  return Object.fromEntries(normalizedEntries);
}

export function areMigrationSnapshotsEquivalent(actualSnapshot: unknown, expectedSnapshot: unknown): boolean {
  return isDeepStrictEqual(normalizeSnapshot(actualSnapshot), normalizeSnapshot(expectedSnapshot));
}
