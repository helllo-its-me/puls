import { profileResponseSchema } from '@health/shared';
import { Hono } from 'hono';

import { getProfile } from '../features/profile/profile.service.js';

export const profileRoute = new Hono().get('/profile', (context) => {
  const profile = profileResponseSchema.parse(getProfile());

  return context.json(profile);
});
