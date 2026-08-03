import {
  authErrorResponseSchema,
  type AuthErrorCode,
  type AuthErrorResponse
} from '@health/shared';

import { AuthRateLimitExceededError } from '../features/auth/auth.errors.js';

export function createAuthErrorResponse(
  code: AuthErrorCode,
  message: string
): AuthErrorResponse {
  return authErrorResponseSchema.parse({ code, message });
}

export function applyRateLimitResponseHeaders(
  context: { header: (name: string, value: string) => void },
  error: AuthRateLimitExceededError
): void {
  context.header('Retry-After', String(error.retryAfterSeconds));
}
