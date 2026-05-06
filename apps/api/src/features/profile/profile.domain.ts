import type { ProfileGender, UpdateProfileRequest } from '@health/shared';

export type Profile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  gender: ProfileGender | null;
  membershipTier: string;
  planTitle: string;
  joinedAt: Date;
  nextSessionAt: Date;
  streakDays: number;
  completionPercent: number;
  energyLabel: string;
  consistencyNote: string;
  supportNote: string;
};

export type ProfileFocusArea = {
  id: string;
  profileId: string;
  label: string;
  progressLabel: string;
  position: number;
};

export type ProfileHighlight = {
  id: string;
  profileId: string;
  title: string;
  description: string;
  position: number;
};

export type ProfileQuickAction = {
  id: string;
  profileId: string;
  label: string;
  description: string;
  accent: string;
  position: number;
};

export type ProfileAggregate = {
  profile: Profile;
  focusAreas: ProfileFocusArea[];
  highlights: ProfileHighlight[];
  quickActions: ProfileQuickAction[];
};

export type UpdateProfileInput = UpdateProfileRequest;
