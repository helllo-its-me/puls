import { Hono } from 'hono';

export const healthRoute = new Hono().get('/health', (context) => {
  return context.json({
    status: 'ok',
    service: 'api'
  });
});
