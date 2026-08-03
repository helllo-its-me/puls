import { authErrorCodes } from '@health/shared';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

import { httpLogger } from '../common/http-logger.js';
import { resolveAuthClientAddress } from '../features/auth/auth.client-address.js';
import { createAuthRoute } from '../routes/auth.route.js';
import { authRequestBodyMaximumBytes } from '../routes/auth-route.config.js';
import { healthRoute } from '../routes/health.route.js';
import { profileRoute } from '../routes/profile.route.js';
import { createAuthErrorResponse } from '../routes/auth-route.response.js';
import { readApiSecurityConfig } from './api-security.config.js';
import type { AppEnvironment } from './app.environment.js';

export function createApp() {
  const securityConfig = readApiSecurityConfig();
  const app = new Hono<AppEnvironment>();

  app.use('*', secureHeaders());
  app.use('/api/*', cors({
    allowHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
    origin: (origin) => {
      if (securityConfig.webAppOrigins.length === 0) {
        return securityConfig.allowUnlistedWebOrigins ? origin : '';
      }

      return securityConfig.webAppOrigins.includes(origin) ? origin : '';
    }
  }));
  app.use('/api/v1/auth/*', bodyLimit({
    maxSize: authRequestBodyMaximumBytes,
    onError: (context) => context.json(createAuthErrorResponse(
      authErrorCodes.invalid_request,
      'Auth request body is too large'
    ), 413)
  }));
  app.use('/api/v1/auth/*', async (context, next) => {
    context.set('authClientAddress', resolveAuthClientAddress({
      directAddress: context.env?.incoming?.socket.remoteAddress,
      forwardedForHeader: context.req.header('x-forwarded-for'),
      trustedProxyHops: securityConfig.trustedProxyHops
    }));
    await next();
  });
  app.use('*', httpLogger);
  app.route('/api/v1', createAuthRoute({
    registrationMinimumResponseMilliseconds:
      securityConfig.registrationMinimumResponseMilliseconds,
    passwordResetMinimumResponseMilliseconds:
      securityConfig.passwordResetMinimumResponseMilliseconds,
    webAppOrigins: securityConfig.webAppOrigins,
    allowUnlistedWebOrigins: securityConfig.allowUnlistedWebOrigins,
    secureWebCookies: securityConfig.secureWebCookies
  }));
  app.route('/api/v1', healthRoute);
  app.route('/api/v1', profileRoute);

  return app;
}
