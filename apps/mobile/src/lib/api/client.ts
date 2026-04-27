import { currentUserIdHeaderName } from '@health/shared';
import { z } from 'zod';

import { env } from '@/config/env';

export async function apiGet<TSchema extends z.ZodType>(
  path: string,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    headers: {
      [currentUserIdHeaderName]: env.devUserId
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data: unknown = await response.json();

  return schema.parse(data);
}
