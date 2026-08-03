import { Platform } from 'react-native';
import { z } from 'zod';

import { authErrorCodeSchema } from '@health/shared';

import { env } from '@/config/env';
import { ApiError } from '@/lib/api/api-error';

const errorResponseSchema = z.object({
  message: z.string().min(1),
  code: authErrorCodeSchema.nullable().optional()
});

function buildHeaders(accessToken: string | null): HeadersInit {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

async function parseResponse<TSchema extends z.ZodType>(
  response: Response,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => null);
    const parsedError = errorResponseSchema.safeParse(errorData);
    const message = parsedError.success ? parsedError.data.message : 'Request failed';

    throw new ApiError(
      message,
      response.status,
      parsedError.success ? parsedError.data.code ?? null : null
    );
  }

  const data: unknown = await response.json();

  return schema.parse(data);
}

export async function apiGet<TSchema extends z.ZodType>(
  path: string,
  schema: TSchema,
  accessToken: string | null
): Promise<z.infer<TSchema>> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    credentials: Platform.OS === 'web' ? 'include' : 'omit',
    headers: buildHeaders(accessToken)
  });

  return parseResponse(response, schema);
}

export async function apiPost<TSchema extends z.ZodType>(
  path: string,
  body: unknown,
  schema: TSchema,
  accessToken: string | null = null
): Promise<z.infer<TSchema>> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: 'POST',
    credentials: Platform.OS === 'web' ? 'include' : 'omit',
    headers: {
      ...buildHeaders(accessToken),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  return parseResponse(response, schema);
}

export async function apiPatch<TSchema extends z.ZodType>(
  path: string,
  body: unknown,
  schema: TSchema,
  accessToken: string
): Promise<z.infer<TSchema>> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: 'PATCH',
    credentials: Platform.OS === 'web' ? 'include' : 'omit',
    headers: {
      ...buildHeaders(accessToken),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  return parseResponse(response, schema);
}
