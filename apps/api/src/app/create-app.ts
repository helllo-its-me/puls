import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { httpLogger } from '../common/http-logger.js';
import { healthRoute } from '../routes/health.route.js';
import { profileRoute } from '../routes/profile.route.js';

export function createApp() {
  const app = new Hono();

  app.use('/api/*', cors());
  app.use('*', httpLogger);
  app.route('/api/v1', healthRoute);
  app.route('/api/v1', profileRoute);

  return app;
}
