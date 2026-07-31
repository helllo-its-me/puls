import { defineConfig, devices } from '@playwright/test';

const apiPort = 3100;
const apiBaseUrl = `http://127.0.0.1:${apiPort}/api/v1`;
const webPort = 19007;
const webUrl = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: webUrl,
    locale: 'en-US',
    trace: 'on-first-retry'
  },
  webServer: [
    {
      command:
        `pnpm db:up && until docker compose exec -T postgres pg_isready -U postgres -d health_app; do sleep 1; done && pnpm --filter @health/db exec drizzle-kit push --force && pnpm db:seed && AUTH_TOKEN_SECRET=e2e-auth-secret PORT=${apiPort} pnpm --filter @health/api dev`,
      url: `${apiBaseUrl}/health`,
      reuseExistingServer: false,
      timeout: 120_000
    },
    {
      command: `cd apps/mobile && pnpm exec expo export --platform web --output-dir dist/e2e-web --clear && cd ../.. && node scripts/serve-spa.mjs apps/mobile/dist/e2e-web ${webPort}`,
      env: {
        EXPO_NO_DOTENV: '1',
        EXPO_PUBLIC_API_BASE_URL: apiBaseUrl
      },
      url: webUrl,
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
