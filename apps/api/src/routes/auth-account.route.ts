import {
  authErrorCodes,
  authMeResponseSchema,
  authResponseSchema,
  authStatusResponseSchema,
  loginRequestSchema,
  registerRequestSchema,
  registerRequestResponseSchema,
  registerVerifyRequestSchema
} from '@health/shared';
import {
  AuthRateLimitExceededError,
  InvalidEmailVerificationCodeError,
  InvalidCredentialsError
} from '../features/auth/auth.errors.js';
import { loginUser } from '../features/auth/auth.service.js';
import {
  registerUser,
  verifyRegisteredEmail
} from '../features/auth/registration.service.js';
import { getAuthenticatedUser } from '../features/auth/authentication.service.js';
import {
  createWebAuthResponse,
  isWebAuthClient,
  setWebRefreshToken
} from './auth-web-session.js';
import type { AuthRouteConfig } from './auth-route.config.js';
import {
  applyRateLimitResponseHeaders,
  createAuthErrorResponse
} from './auth-route.response.js';
import { createAuthRequestRouter, parseAuthRequest } from './auth-request.js';

function respondWithAuthSession(
  context: Parameters<typeof setWebRefreshToken>[0],
  result: Awaited<ReturnType<typeof loginUser>>,
  config: AuthRouteConfig
) {
  if (isWebAuthClient(context, config)) {
    setWebRefreshToken(context, result.refreshToken, config.secureWebCookies);
    return context.json(authResponseSchema.parse(createWebAuthResponse(result)), 200);
  }

  return context.json(authResponseSchema.parse(result), 200);
}

export function createAuthAccountRoute(config: AuthRouteConfig) {
  return createAuthRequestRouter()
    .get('/auth/me', async (context) => {
      const currentUser = await getAuthenticatedUser(context.req.header('authorization'));

      if (!currentUser) {
        return context.json(createAuthErrorResponse(
          authErrorCodes.authentication_required,
          'Current user is required'
        ), 401);
      }

      return context.json(authMeResponseSchema.parse({
        user: {
          id: currentUser.id,
          email: currentUser.email
        }
      }));
    })
    .post('/auth/register/verify', async (context) => {
      try {
        const payload = await parseAuthRequest(context, registerVerifyRequestSchema);
        await verifyRegisteredEmail(payload, context.get('authClientAddress'));

        return context.json(authStatusResponseSchema.parse({ status: 'ok' }));
      } catch (error) {
        if (error instanceof InvalidEmailVerificationCodeError) {
          return context.json(createAuthErrorResponse(
            authErrorCodes.invalid_email_verification_code,
            error.message
          ), 400);
        }

        if (error instanceof AuthRateLimitExceededError) {
          applyRateLimitResponseHeaders(context, error);
          return context.json(createAuthErrorResponse(
            authErrorCodes.rate_limited,
            'Too many email verification attempts'
          ), 429);
        }

        throw error;
      }
    })
    .post('/auth/register', async (context) => {
      try {
        const payload = await parseAuthRequest(context, registerRequestSchema);
        const result = await registerUser(
          payload,
          context.get('authClientAddress'),
          config.registrationMinimumResponseMilliseconds
        );

        return context.json(registerRequestResponseSchema.parse(result), 202);
      } catch (error) {
        if (error instanceof AuthRateLimitExceededError) {
          applyRateLimitResponseHeaders(context, error);
          return context.json(createAuthErrorResponse(
            authErrorCodes.rate_limited,
            'Too many registration attempts'
          ), 429);
        }

        throw error;
      }
    })
    .post('/auth/login', async (context) => {
      try {
        const payload = await parseAuthRequest(context, loginRequestSchema);
        const result = await loginUser(payload, context.get('authClientAddress'));

        return respondWithAuthSession(context, result, config);
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          return context.json(createAuthErrorResponse(
            authErrorCodes.invalid_credentials,
            'Invalid email or password'
          ), 401);
        }

        if (error instanceof AuthRateLimitExceededError) {
          applyRateLimitResponseHeaders(context, error);
          return context.json(createAuthErrorResponse(
            authErrorCodes.rate_limited,
            'Too many login attempts'
          ), 429);
        }

        throw error;
      }
    });
}
