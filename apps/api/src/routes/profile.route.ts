import { profileResponseSchema } from '@health/shared';
import { Hono } from 'hono';

import { getBearerToken, verifyAccessToken } from '../features/auth/auth.token.js';
import { getProfileByUserId } from '../features/profile/profile.service.js';

export const profileRoute = new Hono().get('/profile', async (context) => {
  const token = getBearerToken(context.req.header('authorization'));
  const currentUser = token ? verifyAccessToken(token) : null;

  if (!currentUser) {
    return context.json({ message: 'Current user is required' }, 401);
  }

  const profile = await getProfileByUserId(currentUser.sub);

  if (!profile) {
    return context.json({ message: 'Profile not found' }, 404);
  }

  const parsedProfile = profileResponseSchema.parse(profile);

  return context.json(parsedProfile);
});
