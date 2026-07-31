import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/integration/database-migrations.test.ts'],
    environment: 'node',
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 120_000
  }
});
