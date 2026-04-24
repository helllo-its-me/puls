import { describe, expect, it } from 'vitest';

import { getProfile } from '../../apps/api/src/features/profile/profile.service.js';
import {
  getProfileActionViews,
  getProfileFocusTones,
  getProfileHeroStats
} from '../../apps/mobile/src/features/profile/model/profile-view.js';

describe('profile view model', () => {
  it('builds hero stats from the profile response', () => {
    const profile = getProfile();

    expect(getProfileHeroStats(profile)).toEqual([
      {
        id: 'streak',
        label: 'Streak',
        value: '12 days'
      },
      {
        id: 'completion',
        label: 'Completion',
        value: '84%'
      },
      {
        id: 'energy',
        label: 'Energy',
        value: 'Calm focus'
      }
    ]);
  });

  it('assigns stable tones to focus areas and actions', () => {
    const profile = getProfile();

    expect(getProfileFocusTones(profile)).toEqual([
      {
        id: 'sleep',
        tone: 'mint'
      },
      {
        id: 'movement',
        tone: 'sky'
      },
      {
        id: 'stress',
        tone: 'lavender'
      }
    ]);

    expect(getProfileActionViews(profile).map((action) => action.tone)).toEqual([
      'mint',
      'sky',
      'lavender'
    ]);
  });
});
