import { currentUserIdHeaderName, profileResponseSchema } from '@health/shared';
import { Hono } from 'hono';

import { getProfileByUserId } from '../features/profile/profile.service.js';

export const profileRoute = new Hono().get('/profile', async (context) => {
  const userId = context.req.header(currentUserIdHeaderName);

  if (!userId) {
    return context.json({ message: 'Current user is required' }, 401);
  }

  const profile = await getProfileByUserId(userId);

  if (!profile) {
    return context.json({ message: 'Profile not found' }, 404);
  }

  const parsedProfile = profileResponseSchema.parse(profile);

  return context.json(parsedProfile);
});
