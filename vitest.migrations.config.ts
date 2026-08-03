import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@health/db': resolve(__dirname, 'packages/db/src/index.ts'),
      '@health/shared': resolve(__dirname, 'packages/shared/src/index.ts')
    }
  },
  test: {
    include: [
      'tests/integration/auth-registration-flow.test.ts',
      'tests/integration/auth-password-reset-flow.test.ts',
      'tests/integration/database-migrations.test.ts'
    ],
    environment: 'node',
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 120_000
  }
});
