import { describe, expect, it } from 'vitest';

import { profileResponseSchema } from '@health/shared';

import { getProfile } from '../../apps/api/src/features/profile/profile.service.js';

describe('getProfile', () => {
  it('returns a profile that matches the shared contract', () => {
    const profile = getProfile();
    const parsedProfile = profileResponseSchema.parse(profile);

    expect(parsedProfile.id).toBe('profile-primary');
    expect(parsedProfile.focusAreas).toHaveLength(3);
    expect(parsedProfile.quickActions.map((action) => action.accent)).toEqual([
      'mint',
      'sky',
      'lavender'
    ]);
  });
});
