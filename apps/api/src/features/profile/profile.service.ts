import type { ProfileResponse } from '@health/shared';

import type { ProfileAggregate } from './profile.domain.js';
import { getProfileByUserId as getProfileAggregateByUserId } from './profile.repository.js';

function getAccent(
  accent: string
): 'mint' | 'sky' | 'lavender' {
  if (accent === 'mint' || accent === 'sky' || accent === 'lavender') {
    return accent;
  }

  return 'mint';
}

export function mapProfileAggregateToResponse(profileAggregate: ProfileAggregate): ProfileResponse {
  const { profile, focusAreas, highlights, quickActions } = profileAggregate;

  return {
    id: profile.id,
    firstName: profile.firstName,
    fullName: `${profile.firstName} ${profile.lastName}`,
    membershipTier: profile.membershipTier,
    planTitle: profile.planTitle,
    joinedAt: profile.joinedAt.toISOString(),
    nextSessionAt: profile.nextSessionAt.toISOString(),
    streakDays: profile.streakDays,
    completionPercent: profile.completionPercent,
    energyLabel: profile.energyLabel,
    consistencyLabel: profile.consistencyNote,
    supportLevel: profile.supportNote,
    focusAreas: focusAreas.map((focusArea) => ({
      id: focusArea.id,
      label: focusArea.label,
      progressLabel: focusArea.progressLabel
    })),
    highlights: highlights.map((highlight) => ({
      id: highlight.id,
      title: highlight.title,
      description: highlight.description
    })),
    quickActions: quickActions.map((action) => ({
      id: action.id,
      label: action.label,
      description: action.description,
      accent: getAccent(action.accent)
    }))
  };
}

export async function getProfileByUserId(userId: string): Promise<ProfileResponse | null> {
  const profileAggregate = await getProfileAggregateByUserId(userId);

  if (!profileAggregate) {
    return null;
  }

  return mapProfileAggregateToResponse(profileAggregate);
}
