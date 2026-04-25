import { profileResponseSchema } from '@health/shared';
import { Hono } from 'hono';

import { getProfile } from '../features/profile/profile.service.js';

export const profileRoute = new Hono().get('/profile', async (context) => {
  const profile = await getProfile();

  if (!profile) {
    return context.json({ message: 'Profile not found' }, 404);
  }

  const parsedProfile = profileResponseSchema.parse(profile);

  return context.json(parsedProfile);
});
