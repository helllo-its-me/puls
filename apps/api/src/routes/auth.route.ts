import {
  authMeResponseSchema,
  authResponseSchema,
  authStatusResponseSchema,
  loginRequestSchema,
  passwordResetCompleteRequestSchema,
  passwordResetRequestSchema,
  passwordResetVerifyResponseSchema,
  passwordResetVerifyRequestSchema,
  refreshTokenRequestSchema,
  registerRequestSchema
} from '@health/shared';
import { Hono } from 'hono';
import { ZodError } from 'zod';

import {
  loginUser,
  logoutUser,
  refreshAuthSession,
  registerUser
} from '../features/auth/auth.service.js';
import { getBearerToken, verifyAccessToken } from '../features/auth/auth.token.js';
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
  .get('/auth/me', async (context) => {
    const token = getBearerToken(context.req.header('authorization'));
    const currentUser = token ? verifyAccessToken(token) : null;

    if (!currentUser) {
      return context.json({ message: 'Current user is required' }, 401);
    }

    return context.json(authMeResponseSchema.parse({
      user: {
        id: currentUser.sub,
        email: currentUser.email
      }
    }));
  })
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
  .post('/auth/refresh', async (context) => {
    try {
      const payload = refreshTokenRequestSchema.parse(await context.req.json());
      const result = await refreshAuthSession(payload);

      return context.json(authResponseSchema.parse(result));
    } catch (error) {
      if (error instanceof ZodError) {
        return context.json({ message: 'Invalid refresh payload' }, 400);
      }

      if (getErrorMessage(error) === 'Invalid or expired refresh session') {
        return context.json({ message: 'Invalid or expired refresh session' }, 401);
      }

      throw error;
    }
  })
  .post('/auth/logout', async (context) => {
    try {
      const payload = refreshTokenRequestSchema.parse(await context.req.json());
      await logoutUser(payload);

      return context.json(authStatusResponseSchema.parse({ status: 'ok' }));
    } catch (error) {
      if (error instanceof ZodError) {
        return context.json({ message: 'Invalid logout payload' }, 400);
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
