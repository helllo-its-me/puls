import type { z } from 'zod';

import type {
  authResponseSchema,
  authUserSchema,
  loginRequestSchema,
  registerRequestSchema
} from './schemas';

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
