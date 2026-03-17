import { serve } from '@hono/node-server';

import { createApp } from './app/create-app.js';
import { logger } from './common/logger.js';

const port = Number(process.env.PORT ?? 3001);
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
