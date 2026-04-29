import type { ProfileResponse } from '@health/shared';

import type { AppLocale } from '@/i18n/locale';
import { getIntlLocale } from '@/i18n/locale';
import type { TranslationKey } from '@/i18n/dictionaries';
import type { Translate } from '@/i18n/translation';

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

const profileContentTranslationKeys = {
  'profile-primary': {
    membershipTier: 'profile.content.profile-primary.membershipTier',
    planTitle: 'profile.content.profile-primary.planTitle',
    energyLabel: 'profile.content.profile-primary.energyLabel',
    consistencyLabel: 'profile.content.profile-primary.consistencyLabel',
    supportLevel: 'profile.content.profile-primary.supportLevel'
  }
} as const;

const focusAreaTranslationKeys = {
  sleep: {
    label: 'profile.content.focusArea.sleep.label',
    progress: 'profile.content.focusArea.sleep.progress'
  },
  movement: {
    label: 'profile.content.focusArea.movement.label',
    progress: 'profile.content.focusArea.movement.progress'
  },
  stress: {
    label: 'profile.content.focusArea.stress.label',
    progress: 'profile.content.focusArea.stress.progress'
  }
} as const;

const highlightTranslationKeys = {
  routine: {
    title: 'profile.content.highlight.routine.title',
    description: 'profile.content.highlight.routine.description'
  },
  coach: {
    title: 'profile.content.highlight.coach.title',
    description: 'profile.content.highlight.coach.description'
  }
} as const;

const quickActionTranslationKeys = {
  plan: {
    label: 'profile.content.quickAction.plan.label',
    description: 'profile.content.quickAction.plan.description'
  },
  coach: {
    label: 'profile.content.quickAction.coach.label',
    description: 'profile.content.quickAction.coach.description'
  },
  edit: {
    label: 'profile.content.quickAction.edit.label',
    description: 'profile.content.quickAction.edit.description'
  }
} as const;

type ProfileContentTranslationSet = {
  membershipTier: TranslationKey;
  planTitle: TranslationKey;
  energyLabel: TranslationKey;
  consistencyLabel: TranslationKey;
  supportLevel: TranslationKey;
};

type FocusAreaTranslationSet = {
  label: TranslationKey;
  progress: TranslationKey;
};

type HighlightTranslationSet = {
  title: TranslationKey;
  description: TranslationKey;
};

type QuickActionTranslationSet = {
  label: TranslationKey;
  description: TranslationKey;
};

function getTranslatedValue(
  fallbackValue: string,
  translationKey: TranslationKey | null,
  t: Translate
): string {
  if (!translationKey) {
    return fallbackValue;
  }

  return t(translationKey);
}

function getProfileContentTranslationSet(profileId: string): ProfileContentTranslationSet | null {
  if (profileId === 'profile-primary') {
    return profileContentTranslationKeys['profile-primary'];
  }

  return null;
}

function getFocusAreaTranslationSet(focusAreaId: string): FocusAreaTranslationSet | null {
  if (focusAreaId === 'sleep') {
    return focusAreaTranslationKeys.sleep;
  }

  if (focusAreaId === 'movement') {
    return focusAreaTranslationKeys.movement;
  }

  if (focusAreaId === 'stress') {
    return focusAreaTranslationKeys.stress;
  }

  return null;
}

function getHighlightTranslationSet(highlightId: string): HighlightTranslationSet | null {
  if (highlightId === 'routine') {
    return highlightTranslationKeys.routine;
  }

  if (highlightId === 'coach') {
    return highlightTranslationKeys.coach;
  }

  return null;
}

function getQuickActionTranslationSet(quickActionId: string): QuickActionTranslationSet | null {
  if (quickActionId === 'plan') {
    return quickActionTranslationKeys.plan;
  }

  if (quickActionId === 'coach') {
    return quickActionTranslationKeys.coach;
  }

  if (quickActionId === 'edit') {
    return quickActionTranslationKeys.edit;
  }

  return null;
}

function formatJoinedAtLabel(joinedAt: string, locale: AppLocale, t: Translate): string {
  const formatter = new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });

  return `${t('profile.hero.withUsSincePrefix')} ${formatter.format(new Date(joinedAt))}`;
}

function formatNextSessionLabel(nextSessionAt: string, locale: AppLocale, t: Translate): string {
  const formatter = new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  });

  return `${t('profile.hero.nextSessionPrefix')} ${formatter.format(new Date(nextSessionAt))}`;
}

function buildHeroStats(
  profile: ProfileResponse,
  translationKeys: ProfileContentTranslationSet | null,
  t: Translate
): ProfileHeroStatViewData[] {
  return [
    {
      id: 'streak',
      label: t('profile.hero.stat.streak'),
      value: `${profile.streakDays} ${t('profile.hero.daysSuffix')}`
    },
    {
      id: 'completion',
      label: t('profile.hero.stat.completion'),
      value: `${profile.completionPercent}%`
    },
    {
      id: 'energy',
      label: t('profile.hero.stat.energy'),
      value: getTranslatedValue(
        profile.energyLabel,
        translationKeys?.energyLabel ?? null,
        t
      )
    }
  ];
}

type BuildProfileScreenViewDataOptions = {
  locale: AppLocale;
  t: Translate;
};

export function buildProfileScreenViewData(
  profile: ProfileResponse,
  options: BuildProfileScreenViewDataOptions
): ProfileScreenViewData {
  const { locale, t } = options;
  const profileTranslationKeys = getProfileContentTranslationSet(profile.id);

  return {
    hero: {
      membershipTier: getTranslatedValue(
        profile.membershipTier,
        profileTranslationKeys?.membershipTier ?? null,
        t
      ),
      joinedAtLabel: formatJoinedAtLabel(profile.joinedAt, locale, t),
      avatarLabel: profile.firstName.charAt(0),
      title: `${profile.firstName}, ${t('profile.hero.titleSuffix')}`,
      planTitle: getTranslatedValue(
        profile.planTitle,
        profileTranslationKeys?.planTitle ?? null,
        t
      ),
      nextSessionLabel: formatNextSessionLabel(profile.nextSessionAt, locale, t),
      stats: buildHeroStats(profile, profileTranslationKeys, t)
    },
    summary: {
      completionPercent: profile.completionPercent,
      title: t('profile.summary.title'),
      consistencyLabel: getTranslatedValue(
        profile.consistencyLabel,
        profileTranslationKeys?.consistencyLabel ?? null,
        t
      ),
      supportLevel: getTranslatedValue(
        profile.supportLevel,
        profileTranslationKeys?.supportLevel ?? null,
        t
      )
    },
    focusAreas: profile.focusAreas.map((focusArea, index) => {
      const translationSet = getFocusAreaTranslationSet(focusArea.id);

      return {
        id: focusArea.id,
        label: getTranslatedValue(
          focusArea.label,
          translationSet?.label ?? null,
          t
        ),
        progressLabel: getTranslatedValue(
          focusArea.progressLabel,
          translationSet?.progress ?? null,
          t
        ),
        tone: focusAreaTones[index % focusAreaTones.length] ?? 'mint'
      };
    }),
    highlights: profile.highlights.map((highlight) => {
      const translationSet = getHighlightTranslationSet(highlight.id);

      return {
        id: highlight.id,
        title: getTranslatedValue(
          highlight.title,
          translationSet?.title ?? null,
          t
        ),
        description: getTranslatedValue(
          highlight.description,
          translationSet?.description ?? null,
          t
        )
      };
    }),
    quickActions: profile.quickActions.map((quickAction) => {
      const translationSet = getQuickActionTranslationSet(quickAction.id);

      return {
        id: quickAction.id,
        label: getTranslatedValue(
          quickAction.label,
          translationSet?.label ?? null,
          t
        ),
        description: getTranslatedValue(
          quickAction.description,
          translationSet?.description ?? null,
          t
        ),
        tone: quickAction.accent,
        actionLabel: getTranslatedValue(
          quickAction.label,
          translationSet?.label ?? null,
          t
        )
      };
    })
  };
}
