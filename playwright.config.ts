import { defineConfig, devices } from '@playwright/test';

import {
  e2eAuthTokenSecret,
  e2eDatabaseName,
  e2eDatabaseUrl
} from './tests/e2e/e2e-auth.config';

const apiPort = 3100;
const apiBaseUrl = `http://127.0.0.1:${apiPort}/api/v1`;
const webPort = 19007;
const webUrl = `http://127.0.0.1:${webPort}`;

process.env.PULS_E2E_DATABASE_NAME = e2eDatabaseName;
process.env.DATABASE_URL = e2eDatabaseUrl;

export default defineConfig({
  testDir: './tests/e2e',
  globalTeardown: './tests/e2e/e2e-global-teardown.ts',
  fullyParallel: true,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }]
  ],
  use: {
    baseURL: webUrl,
    locale: 'en-US',
    trace: 'on-first-retry'
  },
  webServer: [
    {
      command:
        `pnpm db:up && until docker compose exec -T postgres pg_isready -U postgres -d postgres; do sleep 1; done && docker compose exec -T postgres dropdb --if-exists --force -U postgres ${e2eDatabaseName} && docker compose exec -T postgres createdb -U postgres ${e2eDatabaseName} && DATABASE_URL=${e2eDatabaseUrl} pnpm db:migrate && DATABASE_URL=${e2eDatabaseUrl} pnpm db:seed && NODE_ENV=test DATABASE_URL=${e2eDatabaseUrl} AUTH_TOKEN_SECRET=${e2eAuthTokenSecret} REGISTRATION_MIN_RESPONSE_MS=0 PASSWORD_RESET_MIN_RESPONSE_MS=0 WEB_APP_ORIGINS=${webUrl} PORT=${apiPort} pnpm --filter @health/api dev`,
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
