import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:19007',
    trace: 'on-first-retry'
  },
  webServer: [
    {
      command: 'PORT=3100 pnpm --filter @health/api dev',
      url: 'http://127.0.0.1:3100/api/v1/health',
      reuseExistingServer: false,
      timeout: 120_000
    },
    {
      command:
        'EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3100/api/v1 pnpm --filter @health/mobile exec expo start --web --port 19007',
      url: 'http://127.0.0.1:19007',
      reuseExistingServer: false,
      timeout: 180_000
    }
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ]
});
