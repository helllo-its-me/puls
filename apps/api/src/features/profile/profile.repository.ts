type ProfileRecord = {
  id: string;
  firstName: string;
  lastName: string;
  membershipTier: string;
  planTitle: string;
  joinedAtLabel: string;
  nextSessionLabel: string;
  streakDays: number;
  completionPercent: number;
  energyLabel: string;
  consistencyLabel: string;
  supportLevel: string;
  focusAreas: {
    id: string;
    label: string;
    progressLabel: string;
  }[];
  highlights: {
    id: string;
    title: string;
    description: string;
  }[];
  quickActions: {
    id: string;
    label: string;
    description: string;
    accent: 'mint' | 'sky' | 'lavender';
  }[];
};

const profileRecord: ProfileRecord = {
  id: 'profile-primary',
  firstName: 'Tanya',
  lastName: 'Vorobyova',
  membershipTier: 'Premium care',
  planTitle: 'Mindful reset plan',
  joinedAtLabel: 'With us since April 2026',
  nextSessionLabel: 'Next guided session today at 19:30',
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

export function getProfileRecord(): ProfileRecord {
  return profileRecord;
}
