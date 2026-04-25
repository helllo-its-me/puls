import { describe, expect, it } from 'vitest';

import {
  getProfileActionViews,
  getProfileFocusTones,
  getProfileHeroStats
} from '../../apps/mobile/src/features/profile/model/profile-view.js';
import { profileResponseFixture } from '../fixtures/profile.js';

describe('profile view model', () => {
  it('builds hero stats from the profile response', () => {
    expect(getProfileHeroStats(profileResponseFixture)).toEqual([
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
    expect(getProfileFocusTones(profileResponseFixture)).toEqual([
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

    expect(getProfileActionViews(profileResponseFixture).map((action) => action.tone)).toEqual([
      'mint',
      'sky',
      'lavender'
    ]);
  });
});
