import { z } from 'zod';

const emailMaximumLength = 255;
const opaqueTokenMaximumLength = 128;
const emailSchema = z.string().trim().toLowerCase().email().max(emailMaximumLength);
const passwordMaximumLength = 128;
const newPasswordMinimumLength = 15;
const loginPasswordSchema = z.string().min(1);
const newPasswordSchema = z
  .string()
  .min(newPasswordMinimumLength)
  .max(passwordMaximumLength);
const nameSchema = z.string().trim().min(1).max(255);

export const registerRequestSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: newPasswordSchema
});

export const registerRequestResponseSchema = z.object({
  status: z.literal('ok'),
  registrationToken: z.string().min(1).max(opaqueTokenMaximumLength)
});

export const registerVerifyRequestSchema = z.object({
  email: emailSchema,
  code: z.string().trim().regex(/^\d{6}$/),
  registrationToken: z.string().min(1).max(opaqueTokenMaximumLength)
});

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema
});

export const passwordResetRequestResponseSchema = z.object({
  status: z.literal('ok'),
  expiresAt: z.iso.datetime()
});

export const passwordResetVerifyRequestSchema = z.object({
  email: emailSchema,
  code: z.string().trim().regex(/^\d{6}$/)
});

export const passwordResetVerifyResponseSchema = z.object({
  resetToken: z.string().min(1).max(opaqueTokenMaximumLength)
});

export const passwordResetCompleteRequestSchema = z.object({
  resetToken: z.string().min(1).max(opaqueTokenMaximumLength),
  password: newPasswordSchema,
  passwordConfirmation: newPasswordSchema
}).refine((input) => input.password === input.passwordConfirmation, {
  message: 'Password confirmation must match password',
  path: ['passwordConfirmation']
});

export const authStatusResponseSchema = z.object({
  status: z.literal('ok')
});

export const authUserSchema = z.object({
  id: z.string(),
  email: emailSchema
});

export const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).nullable(),
  user: authUserSchema
});

export const nativeAuthResponseSchema = authResponseSchema.extend({
  refreshToken: z.string().min(1)
});

export const authMeResponseSchema = z.object({
  user: authUserSchema
});

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1).max(opaqueTokenMaximumLength).nullable()
});
