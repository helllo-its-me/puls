import type { z } from 'zod';

import type {
  authStatusResponseSchema,
  authMeResponseSchema,
  nativeAuthResponseSchema,
  authResponseSchema,
  authUserSchema,
  loginRequestSchema,
  passwordResetCompleteRequestSchema,
  passwordResetRequestSchema,
  passwordResetRequestResponseSchema,
  passwordResetVerifyResponseSchema,
  passwordResetVerifyRequestSchema,
  refreshTokenRequestSchema,
  registerRequestSchema,
  registerRequestResponseSchema,
  registerVerifyRequestSchema
} from './schemas';

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type RegisterRequestResponse = z.infer<typeof registerRequestResponseSchema>;
export type RegisterVerifyRequest = z.infer<typeof registerVerifyRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetRequestResponse = z.infer<
  typeof passwordResetRequestResponseSchema
>;
export type PasswordResetVerifyRequest = z.infer<typeof passwordResetVerifyRequestSchema>;
export type PasswordResetVerifyResponse = z.infer<typeof passwordResetVerifyResponseSchema>;
export type PasswordResetCompleteRequest = z.infer<typeof passwordResetCompleteRequestSchema>;
export type AuthStatusResponse = z.infer<typeof authStatusResponseSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type NativeAuthResponse = z.infer<typeof nativeAuthResponseSchema>;
export type AuthMeResponse = z.infer<typeof authMeResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;
