import {
  authErrorCodes,
  authStatusResponseSchema,
  passwordResetCompleteRequestSchema,
  passwordResetRequestSchema,
  passwordResetRequestResponseSchema,
  passwordResetVerifyResponseSchema,
  passwordResetVerifyRequestSchema
} from '@health/shared';
import {
  AuthRateLimitExceededError,
  InvalidPasswordResetCodeError,
  InvalidPasswordResetSessionError
} from '../features/auth/auth.errors.js';
import {
  completePasswordReset,
  requestPasswordReset,
  verifyPasswordResetCode
} from '../features/auth/password-reset.service.js';
import type { AuthRouteConfig } from './auth-route.config.js';
import {
  applyRateLimitResponseHeaders,
  createAuthErrorResponse
} from './auth-route.response.js';
import { createAuthRequestRouter, parseAuthRequest } from './auth-request.js';

export function createPasswordResetRoute(config: AuthRouteConfig) {
  return createAuthRequestRouter()
    .post('/auth/password-reset/request', async (context) => {
      try {
        const payload = await parseAuthRequest(context, passwordResetRequestSchema);
        const result = await requestPasswordReset(
          payload,
          context.get('authClientAddress'),
          config.passwordResetMinimumResponseMilliseconds
        );

        return context.json(passwordResetRequestResponseSchema.parse(result));
      } catch (error) {
        if (error instanceof AuthRateLimitExceededError) {
          applyRateLimitResponseHeaders(context, error);
          return context.json(createAuthErrorResponse(
            authErrorCodes.rate_limited,
            'Too many password reset requests'
          ), 429);
        }

        throw error;
      }
    })
    .post('/auth/password-reset/verify', async (context) => {
      try {
        const payload = await parseAuthRequest(context, passwordResetVerifyRequestSchema);
        const result = await verifyPasswordResetCode(
          payload,
          context.get('authClientAddress')
        );

        return context.json(passwordResetVerifyResponseSchema.parse(result));
      } catch (error) {
        if (error instanceof InvalidPasswordResetCodeError) {
          return context.json(createAuthErrorResponse(
            authErrorCodes.invalid_reset_code,
            'Invalid or expired reset code'
          ), 400);
        }

        if (error instanceof AuthRateLimitExceededError) {
          applyRateLimitResponseHeaders(context, error);
          return context.json(createAuthErrorResponse(
            authErrorCodes.rate_limited,
            'Too many password reset attempts'
          ), 429);
        }

        throw error;
      }
    })
    .post('/auth/password-reset/complete', async (context) => {
      try {
        const payload = await parseAuthRequest(context, passwordResetCompleteRequestSchema);
        await completePasswordReset(payload);

        return context.json(authStatusResponseSchema.parse({ status: 'ok' }));
      } catch (error) {
        if (error instanceof InvalidPasswordResetSessionError) {
          return context.json(createAuthErrorResponse(
            authErrorCodes.invalid_reset_session,
            'Invalid or expired password reset session'
          ), 400);
        }

        throw error;
      }
    });
}
