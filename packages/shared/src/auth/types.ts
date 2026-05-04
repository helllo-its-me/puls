import type { z } from 'zod';

import type {
  authStatusResponseSchema,
  authResponseSchema,
  authUserSchema,
  loginRequestSchema,
  passwordResetCompleteRequestSchema,
  passwordResetRequestSchema,
  passwordResetVerifyResponseSchema,
  passwordResetVerifyRequestSchema,
  registerRequestSchema
} from './schemas';

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetVerifyRequest = z.infer<typeof passwordResetVerifyRequestSchema>;
export type PasswordResetVerifyResponse = z.infer<typeof passwordResetVerifyResponseSchema>;
export type PasswordResetCompleteRequest = z.infer<typeof passwordResetCompleteRequestSchema>;
export type AuthStatusResponse = z.infer<typeof authStatusResponseSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
