import { profileResponseSchema, type UpdateProfileRequest } from '@health/shared';

import { apiGet, apiPatch } from '@/lib/api/client';

export function getProfile(accessToken: string) {
  return apiGet('/profile', profileResponseSchema, accessToken);
}

export function updateProfile(input: UpdateProfileRequest, accessToken: string) {
  return apiPatch('/profile', input, profileResponseSchema, accessToken);
}
