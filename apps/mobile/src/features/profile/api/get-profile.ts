import { profileResponseSchema } from '@health/shared';

import { apiGet } from '@/lib/api/client';

export function getProfile(accessToken: string) {
  return apiGet('/profile', profileResponseSchema, accessToken);
}
