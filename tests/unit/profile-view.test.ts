import { describe, expect, it } from 'vitest';

import { buildProfileScreenViewData } from '../../apps/mobile/src/features/profile/model/profile-screen-view.js';
import { profileResponseFixture } from '../fixtures/profile.js';

describe('profile view model', () => {
  it('builds screen-specific data from the API response', () => {
    const viewData = buildProfileScreenViewData(profileResponseFixture);

    expect(viewData.hero.stats).toEqual([
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

    expect(viewData.focusAreas).toEqual([
      {
        id: 'sleep',
        label: 'Sleep rhythm',
        progressLabel: '7 nights tracked',
        tone: 'mint'
      },
      {
        id: 'movement',
        label: 'Gentle mobility',
        progressLabel: '3 sessions completed',
        tone: 'sky'
      },
      {
        id: 'stress',
        label: 'Stress relief',
        progressLabel: 'Breathing streak: 5 days',
        tone: 'lavender'
      }
    ]);

    expect(viewData.quickActions.map((action) => action.tone)).toEqual(['mint', 'sky', 'lavender']);
  });
});
