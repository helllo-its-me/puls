import { profileResponseSchema } from '@health/shared';

import { apiGet } from '@/lib/api/client';

export function getProfile() {
  return apiGet('/profile', profileResponseSchema);
}
