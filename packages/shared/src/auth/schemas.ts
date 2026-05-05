import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().email();
const passwordSchema = z.string().min(8);
const nameSchema = z.string().trim().min(1).max(255);

export const registerRequestSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema
});

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema
});

export const passwordResetVerifyRequestSchema = z.object({
  email: emailSchema,
  code: z.string().trim().regex(/^\d{6}$/)
});

export const passwordResetVerifyResponseSchema = z.object({
  resetToken: z.string().min(1)
});

export const passwordResetCompleteRequestSchema = z.object({
  resetToken: z.string().min(1),
  password: passwordSchema,
  passwordConfirmation: passwordSchema
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
  refreshToken: z.string().min(1),
  user: authUserSchema
});

export const authMeResponseSchema = z.object({
  user: authUserSchema
});

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1)
});
