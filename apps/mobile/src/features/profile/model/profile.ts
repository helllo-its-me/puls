export type ProfileMetric = {
  label: string;
  value: string;
  caption: string;
};

export type ProfileInsight = {
  title: string;
  description: string;
};

export type ProfileAction = {
  label: string;
  description: string;
};

export type UserProfile = {
  fullName: string;
  ageLabel: string;
  planLabel: string;
  nextVisitLabel: string;
  completionLabel: string;
  focusAreas: string[];
  metrics: ProfileMetric[];
  insights: ProfileInsight[];
  actions: ProfileAction[];
};

export const profileViewData: UserProfile = {
  fullName: 'Tanya Vorobyova',
  ageLabel: '29 years',
  planLabel: 'Recovery plan: 6 weeks',
  nextVisitLabel: 'Next check-in: Mar 24',
  completionLabel: 'Profile completion: 82%',
  focusAreas: ['Sleep routine', 'Lower back mobility', 'Daily hydration'],
  metrics: [
    {
      label: 'Streak',
      value: '12 days',
      caption: 'Daily routine completed'
    },
    {
      label: 'Mood',
      value: 'Stable',
      caption: 'Last 7 days'
    },
    {
      label: 'Activity',
      value: '84%',
      caption: 'Weekly goal reached'
    }
  ],
  insights: [
    {
      title: 'This week focus',
      description: 'Keep evening stretching after work to reduce back stiffness.'
    },
    {
      title: 'Coach note',
      description: 'You are consistent. The next step is improving sleep timing by 30 minutes.'
    }
  ],
  actions: [
    {
      label: 'Edit profile',
      description: 'Update personal details and health preferences.'
    },
    {
      label: 'Open plan',
      description: 'Review today exercises, notes and progress.'
    },
    {
      label: 'Message coach',
      description: 'Ask a question or share your weekly update.'
    }
  ]
};
