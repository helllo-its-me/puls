import {
  authMeResponseSchema,
  authStatusResponseSchema,
  authResponseSchema,
  passwordResetVerifyResponseSchema,
  type LoginRequest,
  type PasswordResetCompleteRequest,
  type PasswordResetRequest,
  type PasswordResetVerifyRequest,
  type RegisterRequest
} from '@health/shared';

import { apiGet, apiPost } from '@/lib/api/client';

export function register(input: RegisterRequest) {
  return apiPost('/auth/register', input, authResponseSchema);
}

export function login(input: LoginRequest) {
  return apiPost('/auth/login', input, authResponseSchema);
}

export function getCurrentUser(accessToken: string) {
  return apiGet('/auth/me', authMeResponseSchema, accessToken);
}

export function requestPasswordReset(input: PasswordResetRequest) {
  return apiPost('/auth/password-reset/request', input, authStatusResponseSchema);
}

export function verifyPasswordResetCode(input: PasswordResetVerifyRequest) {
  return apiPost('/auth/password-reset/verify', input, passwordResetVerifyResponseSchema);
}

export function completePasswordReset(input: PasswordResetCompleteRequest) {
  return apiPost('/auth/password-reset/complete', input, authStatusResponseSchema);
}
