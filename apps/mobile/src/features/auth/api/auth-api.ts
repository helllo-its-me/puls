import {
  authResponseSchema,
  type LoginRequest,
  type RegisterRequest
} from '@health/shared';

import { apiPost } from '@/lib/api/client';

export function register(input: RegisterRequest) {
  return apiPost('/auth/register', input, authResponseSchema);
}

export function login(input: LoginRequest) {
  return apiPost('/auth/login', input, authResponseSchema);
}
