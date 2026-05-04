import {
  authResponseSchema,
  authStatusResponseSchema,
  loginRequestSchema,
  passwordResetCompleteRequestSchema,
  passwordResetRequestSchema,
  passwordResetVerifyResponseSchema,
  passwordResetVerifyRequestSchema,
  registerRequestSchema
} from '@health/shared';
import { Hono } from 'hono';
import { ZodError } from 'zod';

import { loginUser, registerUser } from '../features/auth/auth.service.js';
import {
  completePasswordReset,
  requestPasswordReset,
  verifyPasswordResetCode
} from '../features/auth/password-reset.service.js';

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
  .post('/auth/password-reset/request', async (context) => {
    try {
      const payload = passwordResetRequestSchema.parse(await context.req.json());
      await requestPasswordReset(payload);

      return context.json(authStatusResponseSchema.parse({ status: 'ok' }));
    } catch (error) {
      if (error instanceof ZodError) {
        return context.json({ message: 'Invalid password reset payload' }, 400);
      }

      throw error;
    }
  })
  .post('/auth/password-reset/verify', async (context) => {
    try {
      const payload = passwordResetVerifyRequestSchema.parse(await context.req.json());
      const result = await verifyPasswordResetCode(payload);

      return context.json(passwordResetVerifyResponseSchema.parse(result));
    } catch (error) {
      if (error instanceof ZodError) {
        return context.json({ message: 'Invalid password reset code payload' }, 400);
      }

      if (getErrorMessage(error) === 'Invalid or expired reset code') {
        return context.json({ message: 'Invalid or expired reset code' }, 400);
      }

      throw error;
    }
  })
  .post('/auth/password-reset/complete', async (context) => {
    try {
      const payload = passwordResetCompleteRequestSchema.parse(await context.req.json());
      await completePasswordReset(payload);

      return context.json(authStatusResponseSchema.parse({ status: 'ok' }));
    } catch (error) {
      if (error instanceof ZodError) {
        return context.json({ message: 'Invalid password reset completion payload' }, 400);
      }

      if (
        getErrorMessage(error) === 'Invalid or expired password reset session'
      ) {
        return context.json({ message: 'Invalid or expired password reset session' }, 400);
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
