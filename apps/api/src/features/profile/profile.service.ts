import type { ProfileResponse } from '@health/shared';

import type { ProfileRecord } from './profile.repository.js';
import { getProfileRecord } from './profile.repository.js';

function getAccent(
  accent: string
): 'mint' | 'sky' | 'lavender' {
  if (accent === 'mint' || accent === 'sky' || accent === 'lavender') {
    return accent;
  }

  return 'mint';
}

function formatJoinedAtLabel(joinedAt: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });

  return `With us since ${formatter.format(joinedAt)}`;
}

function formatNextSessionLabel(nextSessionAt: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  });

  return `Next guided session on ${formatter.format(nextSessionAt)}`;
}

export function mapProfileRecordToResponse(profileRecord: ProfileRecord): ProfileResponse {
  const { profile, focusAreas, highlights, quickActions } = profileRecord;

  return {
    id: profile.id,
    firstName: profile.firstName,
    fullName: `${profile.firstName} ${profile.lastName}`,
    membershipTier: profile.membershipTier,
    planTitle: profile.planTitle,
    joinedAtLabel: formatJoinedAtLabel(profile.joinedAt),
    nextSessionLabel: formatNextSessionLabel(profile.nextSessionAt),
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

export async function getProfile(): Promise<ProfileResponse | null> {
  const profileRecord = await getProfileRecord();

  if (!profileRecord) {
    return null;
  }

  return mapProfileRecordToResponse(profileRecord);
}
