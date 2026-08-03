import { profileResponseSchema, updateProfileRequestSchema } from '@health/shared';
import { Hono } from 'hono';
import { ZodError } from 'zod';

import { getAuthenticatedUser } from '../features/auth/authentication.service.js';
import {
  getProfileByUserId,
  updateProfileByUserId
} from '../features/profile/profile.service.js';

async function getCurrentUserId(
  authorizationHeader: string | undefined
): Promise<string | null> {
  const currentUser = await getAuthenticatedUser(authorizationHeader);

  return currentUser?.id ?? null;
}

export const profileRoute = new Hono().get('/profile', async (context) => {
  const currentUserId = await getCurrentUserId(context.req.header('authorization'));

  if (!currentUserId) {
    return context.json({ message: 'Current user is required' }, 401);
  }

  const profile = await getProfileByUserId(currentUserId);

  if (!profile) {
    return context.json({ message: 'Profile not found' }, 404);
  }

  const parsedProfile = profileResponseSchema.parse(profile);

  return context.json(parsedProfile);
}).patch('/profile', async (context) => {
  const currentUserId = await getCurrentUserId(context.req.header('authorization'));

  if (!currentUserId) {
    return context.json({ message: 'Current user is required' }, 401);
  }

  try {
    const payload = updateProfileRequestSchema.parse(await context.req.json());
    const profile = await updateProfileByUserId(currentUserId, payload);

    if (!profile) {
      return context.json({ message: 'Profile not found' }, 404);
    }

    return context.json(profileResponseSchema.parse(profile));
  } catch (error) {
    if (error instanceof ZodError) {
      return context.json({ message: 'Invalid profile update payload' }, 400);
    }

    throw error;
  }
});
