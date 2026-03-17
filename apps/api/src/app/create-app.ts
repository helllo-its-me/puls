import { Hono } from 'hono';

import { httpLogger } from '../common/http-logger.js';
import { healthRoute } from '../routes/health.route.js';

export function createApp() {
  const app = new Hono();

  app.use('*', httpLogger);
  app.route('/api/v1', healthRoute);

  return app;
}
