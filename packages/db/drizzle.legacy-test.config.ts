import { defineConfig } from 'drizzle-kit';

import { getDatabaseUrl } from './src/database-url.js';

export default defineConfig({
  dbCredentials: {
    url: getDatabaseUrl()
  },
  dialect: 'postgresql',
  schema: './test-fixtures/legacy-push-schema.ts'
});
