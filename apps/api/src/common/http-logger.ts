import type { MiddlewareHandler } from 'hono';

import { logger } from './logger.js';

export const httpLogger: MiddlewareHandler = async (context, next) => {
  const startedAt = Date.now();

  await next();

  const durationMs = Date.now() - startedAt;

  logger.info(
    {
      method: context.req.method,
      path: context.req.path,
      status: context.res.status,
      durationMs
    },
    'HTTP request'
  );
};
