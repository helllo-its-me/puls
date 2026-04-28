import type { ProfileResponse } from '@health/shared';

type AccentTone = 'mint' | 'sky' | 'lavender';

export type ProfileHeroStatViewData = {
  id: string;
  label: string;
  value: string;
};

export type ProfileHeroViewData = {
  membershipTier: string;
  joinedAtLabel: string;
  avatarLabel: string;
  title: string;
  planTitle: string;
  nextSessionLabel: string;
  stats: ProfileHeroStatViewData[];
};

export type ProfileSummaryViewData = {
  completionPercent: number;
  title: string;
  consistencyLabel: string;
  supportLevel: string;
};

export type ProfileFocusAreaItemViewData = {
  id: string;
  label: string;
  progressLabel: string;
  tone: AccentTone;
};

export type ProfileHighlightViewData = {
  id: string;
  title: string;
  description: string;
};

export type ProfileQuickActionViewData = {
  id: string;
  label: string;
  description: string;
  tone: AccentTone;
  actionLabel: string;
};

export type ProfileScreenViewData = {
  hero: ProfileHeroViewData;
  summary: ProfileSummaryViewData;
  focusAreas: ProfileFocusAreaItemViewData[];
  highlights: ProfileHighlightViewData[];
  quickActions: ProfileQuickActionViewData[];
};

const focusAreaTones: readonly AccentTone[] = ['mint', 'sky', 'lavender'] as const;

function buildHeroStats(profile: ProfileResponse): ProfileHeroStatViewData[] {
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

export function buildProfileScreenViewData(profile: ProfileResponse): ProfileScreenViewData {
  return {
    hero: {
      membershipTier: profile.membershipTier,
      joinedAtLabel: profile.joinedAtLabel,
      avatarLabel: profile.firstName.charAt(0),
      title: `${profile.firstName}, your profile`,
      planTitle: profile.planTitle,
      nextSessionLabel: profile.nextSessionLabel,
      stats: buildHeroStats(profile)
    },
    summary: {
      completionPercent: profile.completionPercent,
      title: 'Profile completion is strong',
      consistencyLabel: profile.consistencyLabel,
      supportLevel: profile.supportLevel
    },
    focusAreas: profile.focusAreas.map((focusArea, index) => ({
      id: focusArea.id,
      label: focusArea.label,
      progressLabel: focusArea.progressLabel,
      tone: focusAreaTones[index % focusAreaTones.length] ?? 'mint'
    })),
    highlights: profile.highlights.map((highlight) => ({
      id: highlight.id,
      title: highlight.title,
      description: highlight.description
    })),
    quickActions: profile.quickActions.map((quickAction) => ({
      id: quickAction.id,
      label: quickAction.label,
      description: quickAction.description,
      tone: quickAction.accent,
      actionLabel: quickAction.label
    }))
  };
}
