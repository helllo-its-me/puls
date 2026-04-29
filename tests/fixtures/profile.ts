import type { ProfileResponse } from '@health/shared';

import type { ProfileAggregate } from '../../apps/api/src/features/profile/profile.domain.js';

export const profileResponseFixture: ProfileResponse = {
  id: 'profile-primary',
  firstName: 'Tanya',
  fullName: 'Tanya Vorobyova',
  membershipTier: 'Premium care',
  planTitle: 'Mindful reset plan',
  joinedAt: '2026-04-01T09:00:00.000Z',
  nextSessionAt: '2026-04-25T17:30:00.000Z',
  streakDays: 12,
  completionPercent: 84,
  energyLabel: 'Calm focus',
  consistencyLabel: '4 of 5 habits this week',
  supportLevel: 'Coach support is active',
  focusAreas: [
    {
      id: 'sleep',
      label: 'Sleep rhythm',
      progressLabel: '7 nights tracked'
    },
    {
      id: 'movement',
      label: 'Gentle mobility',
      progressLabel: '3 sessions completed'
    },
    {
      id: 'stress',
      label: 'Stress relief',
      progressLabel: 'Breathing streak: 5 days'
    }
  ],
  highlights: [
    {
      id: 'routine',
      title: 'Your routine is stabilizing',
      description: 'Evening check-ins became more consistent and recovery mornings feel lighter.'
    },
    {
      id: 'coach',
      title: 'Coach recommendation',
      description: 'Keep the bedtime window fixed for the next 4 days to reinforce the new rhythm.'
    }
  ],
  quickActions: [
    {
      id: 'plan',
      label: 'Open my plan',
      description: 'See the full schedule, habits and progress checkpoints.',
      accent: 'mint'
    },
    {
      id: 'coach',
      label: 'Message coach',
      description: 'Send a note, ask a question or share how today went.',
      accent: 'sky'
    },
    {
      id: 'edit',
      label: 'Adjust preferences',
      description: 'Update profile details and tune your care experience.',
      accent: 'lavender'
    }
  ]
};

export const profileAggregateFixture: ProfileAggregate = {
  profile: {
    id: 'profile-primary',
    userId: 'user-primary',
    firstName: 'Tanya',
    lastName: 'Vorobyova',
    membershipTier: 'Premium care',
    planTitle: 'Mindful reset plan',
    joinedAt: new Date('2026-04-01T09:00:00.000Z'),
    nextSessionAt: new Date('2026-04-25T17:30:00.000Z'),
    streakDays: 12,
    completionPercent: 84,
    energyLabel: 'Calm focus',
    consistencyNote: '4 of 5 habits this week',
    supportNote: 'Coach support is active'
  },
  focusAreas: [
    {
      id: 'sleep',
      profileId: 'profile-primary',
      label: 'Sleep rhythm',
      progressLabel: '7 nights tracked',
      position: 0
    },
    {
      id: 'movement',
      profileId: 'profile-primary',
      label: 'Gentle mobility',
      progressLabel: '3 sessions completed',
      position: 1
    },
    {
      id: 'stress',
      profileId: 'profile-primary',
      label: 'Stress relief',
      progressLabel: 'Breathing streak: 5 days',
      position: 2
    }
  ],
  highlights: [
    {
      id: 'routine',
      profileId: 'profile-primary',
      title: 'Your routine is stabilizing',
      description: 'Evening check-ins became more consistent and recovery mornings feel lighter.',
      position: 0
    },
    {
      id: 'coach',
      profileId: 'profile-primary',
      title: 'Coach recommendation',
      description: 'Keep the bedtime window fixed for the next 4 days to reinforce the new rhythm.',
      position: 1
    }
  ],
  quickActions: [
    {
      id: 'plan',
      profileId: 'profile-primary',
      label: 'Open my plan',
      description: 'See the full schedule, habits and progress checkpoints.',
      accent: 'mint',
      position: 0
    },
    {
      id: 'coach',
      profileId: 'profile-primary',
      label: 'Message coach',
      description: 'Send a note, ask a question or share how today went.',
      accent: 'sky',
      position: 1
    },
    {
      id: 'edit',
      profileId: 'profile-primary',
      label: 'Adjust preferences',
      description: 'Update profile details and tune your care experience.',
      accent: 'lavender',
      position: 2
    }
  ]
};
