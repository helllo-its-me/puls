import {
  refreshSessionTtlSeconds,
  type AuthResponse
} from '@health/shared';
import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';

import type { AuthRouteConfig } from './auth-route.config.js';

const refreshTokenCookieName = 'puls_refresh';
const refreshTokenCookiePath = '/api/v1/auth';

export function isAllowedWebAuthOrigin(
  context: Context,
  config: AuthRouteConfig
): boolean {
  const origin = context.req.header('origin');

  if (!origin) {
    return false;
  }

  if (config.webAppOrigins.length === 0) {
    return config.allowUnlistedWebOrigins;
  }

  return config.webAppOrigins.includes(origin);
}

export function isWebAuthClient(context: Context, config: AuthRouteConfig): boolean {
  return isAllowedWebAuthOrigin(context, config);
}

export function getWebRefreshToken(context: Context): string | null {
  return getCookie(context, refreshTokenCookieName) ?? null;
}

export function setWebRefreshToken(
  context: Context,
  refreshToken: string,
  secure: boolean
): void {
  setCookie(context, refreshTokenCookieName, refreshToken, {
    httpOnly: true,
    maxAge: refreshSessionTtlSeconds,
    path: refreshTokenCookiePath,
    sameSite: 'Strict',
    secure
  });
}

export function clearWebRefreshToken(context: Context, secure: boolean): void {
  deleteCookie(context, refreshTokenCookieName, {
    path: refreshTokenCookiePath,
    secure
  });
}

export function createWebAuthResponse(authResponse: AuthResponse): AuthResponse {
  return {
    ...authResponse,
    refreshToken: null
  };
}
