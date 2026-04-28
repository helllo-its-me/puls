export type Profile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
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
