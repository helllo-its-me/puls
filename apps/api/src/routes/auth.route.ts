import { authErrorCodes } from '@health/shared';
import { Hono } from 'hono';

import type { AppEnvironment } from '../app/app.environment.js';
import { isAllowedWebAuthOrigin } from './auth-web-session.js';
import { createAuthAccountRoute } from './auth-account.route.js';
import type { AuthRouteConfig } from './auth-route.config.js';
import { createAuthSessionRoute } from './auth-session.route.js';
import { createPasswordResetRoute } from './password-reset.route.js';
import { createAuthErrorResponse } from './auth-route.response.js';

export function createAuthRoute(config: AuthRouteConfig) {
  return new Hono<AppEnvironment>()
    .use('/auth/*', async (context, next) => {
      await next();
      context.header('Cache-Control', 'no-store');
    })
    .use('/auth/*', async (context, next) => {
      if (context.req.header('origin') && !isAllowedWebAuthOrigin(context, config)) {
        return context.json(createAuthErrorResponse(
          authErrorCodes.web_origin_forbidden,
          'Web auth origin is not allowed'
        ), 403);
      }

      await next();
    })
    .route('', createAuthAccountRoute(config))
    .route('', createAuthSessionRoute(config))
    .route('', createPasswordResetRoute(config));
}
