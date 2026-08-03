import {
  authErrorCodes,
  authResponseSchema,
  authStatusResponseSchema,
  refreshTokenRequestSchema
} from '@health/shared';
import { InvalidRefreshSessionError } from '../features/auth/auth.errors.js';
import { logoutUser, refreshAuthSession } from '../features/auth/auth.service.js';
import {
  clearWebRefreshToken,
  createWebAuthResponse,
  getWebRefreshToken,
  isWebAuthClient,
  setWebRefreshToken
} from './auth-web-session.js';
import type { AuthRouteConfig } from './auth-route.config.js';
import { createAuthErrorResponse } from './auth-route.response.js';
import { createAuthRequestRouter, parseAuthRequest } from './auth-request.js';

export function createAuthSessionRoute(config: AuthRouteConfig) {
  return createAuthRequestRouter()
    .post('/auth/refresh', async (context) => {
      try {
        const payload = await parseAuthRequest(context, refreshTokenRequestSchema);
        const isWebClient = isWebAuthClient(context, config);
        const refreshToken = isWebClient ? getWebRefreshToken(context) : payload.refreshToken;

        if (!refreshToken) {
          throw new InvalidRefreshSessionError();
        }

        const result = await refreshAuthSession({ refreshToken });

        if (isWebClient) {
          setWebRefreshToken(context, result.refreshToken, config.secureWebCookies);
          return context.json(authResponseSchema.parse(createWebAuthResponse(result)));
        }

        return context.json(authResponseSchema.parse(result));
      } catch (error) {
        if (error instanceof InvalidRefreshSessionError) {
          return context.json(createAuthErrorResponse(
            authErrorCodes.invalid_refresh_session,
            'Invalid or expired refresh session'
          ), 401);
        }

        throw error;
      }
    })
    .post('/auth/logout', async (context) => {
      const payload = await parseAuthRequest(context, refreshTokenRequestSchema);
      const isWebClient = isWebAuthClient(context, config);
      const refreshToken = isWebClient ? getWebRefreshToken(context) : payload.refreshToken;

      if (refreshToken) {
        await logoutUser({ refreshToken });
      }

      if (isWebClient) {
        clearWebRefreshToken(context, config.secureWebCookies);
      }

      return context.json(authStatusResponseSchema.parse({ status: 'ok' }));
    });
}
