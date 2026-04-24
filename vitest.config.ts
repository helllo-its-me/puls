import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'apps/mobile/src'),
      '@health/shared': resolve(__dirname, 'packages/shared/src/index.ts'),
      '@health/db': resolve(__dirname, 'packages/db/src/index.ts')
    }
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node'
  }
});
