import { authResponseSchema, loginRequestSchema, registerRequestSchema } from '@health/shared';
import { Hono } from 'hono';
import { ZodError } from 'zod';

import { loginUser, registerUser } from '../features/auth/auth.service.js';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected auth error';
}

export const authRoute = new Hono()
  .post('/auth/register', async (context) => {
    try {
      const payload = registerRequestSchema.parse(await context.req.json());
      const result = await registerUser(payload);

      return context.json(authResponseSchema.parse(result), 201);
    } catch (error) {
      if (error instanceof ZodError) {
        return context.json({ message: 'Invalid registration payload' }, 400);
      }

      if (getErrorMessage(error) === 'Email is already registered') {
        return context.json({ message: 'Email is already registered' }, 409);
      }

      throw error;
    }
  })
  .post('/auth/login', async (context) => {
    try {
      const payload = loginRequestSchema.parse(await context.req.json());
      const result = await loginUser(payload);

      return context.json(authResponseSchema.parse(result));
    } catch (error) {
      if (error instanceof ZodError) {
        return context.json({ message: 'Invalid login payload' }, 400);
      }

      if (getErrorMessage(error) === 'Invalid email or password') {
        return context.json({ message: 'Invalid email or password' }, 401);
      }

      throw error;
    }
  });
