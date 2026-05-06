import type { ProfileResponse, UpdateProfileRequest } from '@health/shared';

import type { ProfileAggregate } from './profile.domain.js';
import {
  getProfileByUserId as getProfileAggregateByUserId,
  updateProfileByUserId as updateProfileAggregateByUserId
} from './profile.repository.js';

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
    lastName: profile.lastName,
    fullName: `${profile.firstName} ${profile.lastName}`,
    birthDate: profile.birthDate,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    gender: profile.gender,
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

export async function updateProfileByUserId(
  userId: string,
  input: UpdateProfileRequest
): Promise<ProfileResponse | null> {
  const profileAggregate = await updateProfileAggregateByUserId(userId, input);

  if (!profileAggregate) {
    return null;
  }

  return mapProfileAggregateToResponse(profileAggregate);
}
