import { describe, expect, it } from 'vitest';

import { areMigrationSnapshotsEquivalent } from '../../packages/db/scripts/migration-snapshot.js';

const expectedSnapshot = {
  id: 'generated-id',
  prevId: 'previous-id',
  version: '7',
  dialect: 'postgresql',
  tables: {
    'public.users': {
      name: 'users',
      columns: {
        id: {
          name: 'id',
          type: 'text',
          primaryKey: true,
          notNull: true
        }
      },
      foreignKeys: {
        users_profile_id_profiles_id_fk: {
          tableFrom: 'users',
          tableTo: 'profiles'
        }
      }
    }
  }
};

describe('areMigrationSnapshotsEquivalent', () => {
  it('ignores generated ids and empty introspection metadata', () => {
    const introspectedSnapshot = {
      ...expectedSnapshot,
      id: 'introspected-id',
      prevId: '',
      internal: {
        tables: {}
      },
      tables: {
        'public.users': {
          ...expectedSnapshot.tables['public.users'],
          foreignKeys: {
            users_profile_id_profiles_id_fk: {
              tableFrom: 'users',
              tableTo: 'profiles',
              schemaTo: 'public'
            }
          }
        }
      }
    };

    expect(areMigrationSnapshotsEquivalent(introspectedSnapshot, expectedSnapshot)).toBe(true);
  });

  it('rejects an unexpected column', () => {
    const driftedSnapshot = {
      ...expectedSnapshot,
      tables: {
        'public.users': {
          ...expectedSnapshot.tables['public.users'],
          columns: {
            ...expectedSnapshot.tables['public.users'].columns,
            unexpected: {
              name: 'unexpected',
              type: 'text',
              primaryKey: false,
              notNull: false
            }
          }
        }
      }
    };

    expect(areMigrationSnapshotsEquivalent(driftedSnapshot, expectedSnapshot)).toBe(false);
  });

  it('does not ignore a non-public foreign-key target schema', () => {
    const driftedSnapshot = {
      ...expectedSnapshot,
      tables: {
        'public.users': {
          ...expectedSnapshot.tables['public.users'],
          foreignKeys: {
            users_profile_id_profiles_id_fk: {
              tableFrom: 'users',
              tableTo: 'profiles',
              schemaTo: 'private'
            }
          }
        }
      }
    };

    expect(areMigrationSnapshotsEquivalent(driftedSnapshot, expectedSnapshot)).toBe(false);
  });
});
