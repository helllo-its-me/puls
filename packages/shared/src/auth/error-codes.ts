import { z } from 'zod';

export const authErrorCodeSchema = z.enum([
  'invalid_request',
  'authentication_required',
  'web_origin_forbidden',
  'invalid_credentials',
  'invalid_email_verification_code',
  'invalid_refresh_session',
  'invalid_reset_code',
  'invalid_reset_session',
  'rate_limited'
]);

export const authErrorCodes = authErrorCodeSchema.enum;

export const authErrorResponseSchema = z.object({
  code: authErrorCodeSchema,
  message: z.string().min(1)
});

export type AuthErrorCode = z.infer<typeof authErrorCodeSchema>;
export type AuthErrorResponse = z.infer<typeof authErrorResponseSchema>;
