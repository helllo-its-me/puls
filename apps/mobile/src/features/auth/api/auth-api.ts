import {
  authMeResponseSchema,
  authStatusResponseSchema,
  authResponseSchema,
  passwordResetRequestResponseSchema,
  passwordResetVerifyResponseSchema,
  registerRequestResponseSchema,
  type LoginRequest,
  type PasswordResetCompleteRequest,
  type PasswordResetRequest,
  type PasswordResetVerifyRequest,
  type RefreshTokenRequest,
  type RegisterRequest,
  type RegisterVerifyRequest
} from '@health/shared';

import { apiGet, apiPost } from '@/lib/api/client';

export function register(input: RegisterRequest) {
  return apiPost('/auth/register', input, registerRequestResponseSchema);
}

export function verifyRegisteredEmail(input: RegisterVerifyRequest) {
  return apiPost('/auth/register/verify', input, authStatusResponseSchema);
}

export function login(input: LoginRequest) {
  return apiPost('/auth/login', input, authResponseSchema);
}

export function getCurrentUser(accessToken: string) {
  return apiGet('/auth/me', authMeResponseSchema, accessToken);
}

export function refreshSession(input: RefreshTokenRequest) {
  return apiPost('/auth/refresh', input, authResponseSchema);
}

export function logout(input: RefreshTokenRequest) {
  return apiPost('/auth/logout', input, authStatusResponseSchema);
}

export function requestPasswordReset(input: PasswordResetRequest) {
  return apiPost('/auth/password-reset/request', input, passwordResetRequestResponseSchema);
}

export function verifyPasswordResetCode(input: PasswordResetVerifyRequest) {
  return apiPost('/auth/password-reset/verify', input, passwordResetVerifyResponseSchema);
}

export function completePasswordReset(input: PasswordResetCompleteRequest) {
  return apiPost('/auth/password-reset/complete', input, authStatusResponseSchema);
}
