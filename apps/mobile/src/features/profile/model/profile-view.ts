import type { ProfileQuickAction, ProfileResponse } from '@health/shared';

type AccentTone = 'mint' | 'sky' | 'lavender';

export type ProfileHeroStat = {
  id: string;
  label: string;
  value: string;
};

export type ProfileFocusTone = {
  id: string;
  tone: AccentTone;
};

export type ProfileActionView = ProfileQuickAction & {
  tone: AccentTone;
};

export function getProfileHeroStats(profile: ProfileResponse): ProfileHeroStat[] {
  return [
    {
      id: 'streak',
      label: 'Streak',
      value: `${profile.streakDays} days`
    },
    {
      id: 'completion',
      label: 'Completion',
      value: `${profile.completionPercent}%`
    },
    {
      id: 'energy',
      label: 'Energy',
      value: profile.energyLabel
    }
  ];
}

export function getProfileFocusTones(profile: ProfileResponse): ProfileFocusTone[] {
  const tones: AccentTone[] = ['mint', 'sky', 'lavender'];

  return profile.focusAreas.map((focusArea, index) => {
    const tone = tones[index % tones.length] ?? 'mint';

    return {
      id: focusArea.id,
      tone
    };
  });
}

export function getProfileActionViews(profile: ProfileResponse): ProfileActionView[] {
  return profile.quickActions.map((action) => ({
    ...action,
    tone: action.accent
  }));
}
