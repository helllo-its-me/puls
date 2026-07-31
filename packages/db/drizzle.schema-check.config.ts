import { defineConfig } from 'drizzle-kit';

const outputDirectory = process.env.DRIZZLE_SCHEMA_CHECK_OUTPUT;

if (!outputDirectory) {
  throw new Error('DRIZZLE_SCHEMA_CHECK_OUTPUT is required');
}

export default defineConfig({
  dialect: 'postgresql',
  out: outputDirectory,
  schema: './src/schema.ts'
});
