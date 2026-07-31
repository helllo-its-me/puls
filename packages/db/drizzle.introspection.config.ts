import { defineConfig } from 'drizzle-kit';

import { getDatabaseUrl } from './src/database-url.js';

const outputDirectory = process.env.DRIZZLE_INTROSPECTION_OUTPUT;

if (!outputDirectory) {
  throw new Error('DRIZZLE_INTROSPECTION_OUTPUT is required');
}

export default defineConfig({
  dialect: 'postgresql',
  out: outputDirectory,
  dbCredentials: {
    url: getDatabaseUrl()
  },
  schemaFilter: ['public']
});
