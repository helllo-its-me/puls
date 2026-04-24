import type { ProfileResponse } from '@health/shared';

import { getProfileRecord } from './profile.repository.js';

export function getProfile(): ProfileResponse {
  const profileRecord = getProfileRecord();

  return {
    id: profileRecord.id,
    firstName: profileRecord.firstName,
    fullName: `${profileRecord.firstName} ${profileRecord.lastName}`,
    membershipTier: profileRecord.membershipTier,
    planTitle: profileRecord.planTitle,
    joinedAtLabel: profileRecord.joinedAtLabel,
    nextSessionLabel: profileRecord.nextSessionLabel,
    streakDays: profileRecord.streakDays,
    completionPercent: profileRecord.completionPercent,
    energyLabel: profileRecord.energyLabel,
    consistencyLabel: profileRecord.consistencyLabel,
    supportLevel: profileRecord.supportLevel,
    focusAreas: profileRecord.focusAreas,
    highlights: profileRecord.highlights,
    quickActions: profileRecord.quickActions
  };
}
