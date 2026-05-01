import 'dotenv/config';

import { serve } from '@hono/node-server';

import { createApp } from './app/create-app.js';
import { logger } from './common/logger.js';
import { assertAuthTokenConfig } from './features/auth/auth.token.js';

const port = Number(process.env.PORT ?? 3001);
assertAuthTokenConfig();
const app = createApp();

serve(
  {
    fetch: app.fetch,
    port
  },
  (info) => {
    logger.info({ port: info.port }, 'API server started');
  }
);
