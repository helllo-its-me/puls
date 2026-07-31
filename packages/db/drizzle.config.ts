import type { Config } from 'drizzle-kit';

import { getDatabaseUrl } from './src/database-url.js';
import { migrationsSchema, migrationsTable } from './src/migration-config.js';

export default {
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl()
  },
  migrations: {
    schema: migrationsSchema,
    table: migrationsTable
  }
} satisfies Config;
