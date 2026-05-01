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

export const authUserSchema = z.object({
  id: z.string(),
  email: emailSchema
});

export const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: authUserSchema
});
