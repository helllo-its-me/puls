import { authErrorCodes } from '@health/shared';
import { Hono, type Context } from 'hono';
import { z } from 'zod';

import type { AppEnvironment } from '../app/app.environment.js';
import { authRequestBodyMaximumBytes } from './auth-route.config.js';
import { createAuthErrorResponse } from './auth-route.response.js';

export class AuthRequestBodyTooLargeError extends Error {
  constructor() {
    super('Auth request body is too large');
    this.name = 'AuthRequestBodyTooLargeError';
  }
}

export class InvalidAuthRequestError extends Error {
  constructor() {
    super('Invalid auth request payload');
    this.name = 'InvalidAuthRequestError';
  }
}

export function createAuthRequestRouter(): Hono<AppEnvironment> {
  const router = new Hono<AppEnvironment>();

  router.onError((error, context) => {
    if (error instanceof AuthRequestBodyTooLargeError) {
      return context.json(createAuthErrorResponse(
        authErrorCodes.invalid_request,
        error.message
      ), 413);
    }

    if (error instanceof InvalidAuthRequestError) {
      return context.json(createAuthErrorResponse(
        authErrorCodes.invalid_request,
        error.message
      ), 400);
    }

    throw error;
  });

  return router;
}

export async function parseAuthRequest<TSchema extends z.ZodType>(
  context: Context,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  let body: unknown;
  const bodyText = await context.req.text();

  if (Buffer.byteLength(bodyText, 'utf8') > authRequestBodyMaximumBytes) {
    throw new AuthRequestBodyTooLargeError();
  }

  try {
    body = JSON.parse(bodyText);
  } catch {
    throw new InvalidAuthRequestError();
  }

  const parsedBody = schema.safeParse(body);

  if (!parsedBody.success) {
    throw new InvalidAuthRequestError();
  }

  return parsedBody.data;
}
