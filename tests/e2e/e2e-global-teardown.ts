import postgres from 'postgres';

import {
  e2eDatabaseAdminUrl,
  e2eDatabaseName
} from './e2e-auth.config';

const e2eDatabaseNamePattern = /^puls_e2e_\d+$/;

export default async function teardownE2eDatabase(): Promise<void> {
  if (!e2eDatabaseNamePattern.test(e2eDatabaseName)) {
    throw new Error(`Refusing to drop unexpected E2E database: ${e2eDatabaseName}`);
  }

  const sql = postgres(e2eDatabaseAdminUrl, { max: 1 });

  try {
    await sql.unsafe(`DROP DATABASE IF EXISTS "${e2eDatabaseName}" WITH (FORCE)`);
  } finally {
    await sql.end();
  }
}
