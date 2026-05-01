import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:19007',
    locale: 'en-US',
    trace: 'on-first-retry'
  },
  webServer: [
    {
      command:
        'pnpm db:up && until docker compose exec -T postgres pg_isready -U postgres -d health_app; do sleep 1; done && pnpm --filter @health/db exec drizzle-kit push --force && pnpm db:seed && AUTH_TOKEN_SECRET=e2e-auth-secret PORT=3100 pnpm --filter @health/api dev',
      url: 'http://127.0.0.1:3100/api/v1/health',
      reuseExistingServer: false,
      timeout: 120_000
    },
    {
      command:
        'cd apps/mobile && EXPO_NO_DOTENV=true EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3100/api/v1 pnpm exec expo start --web --port 19007 --clear',
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
