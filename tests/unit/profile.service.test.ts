import { describe, expect, it } from 'vitest';

import { profileResponseSchema } from '@health/shared';

import { mapProfileRecordToResponse } from '../../apps/api/src/features/profile/profile.service.js';
import { profileRecordFixture } from '../fixtures/profile.js';

describe('mapProfileRecordToResponse', () => {
  it('returns a profile that matches the shared contract', () => {
    const profile = mapProfileRecordToResponse(profileRecordFixture);
    const parsedProfile = profileResponseSchema.parse(profile);

    expect(parsedProfile.id).toBe('profile-primary');
    expect(parsedProfile.joinedAtLabel).toBe('With us since April 2026');
    expect(parsedProfile.nextSessionLabel).toBe('Next guided session on Apr 25, 17:30');
    expect(parsedProfile.focusAreas).toHaveLength(3);
    expect(parsedProfile.quickActions.map((action) => action.accent)).toEqual([
      'mint',
      'sky',
      'lavender'
    ]);
  });
});
