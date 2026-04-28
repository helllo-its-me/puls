import {
  db,
  profileFocusAreasTable,
  profileHighlightsTable,
  profileQuickActionsTable,
  profilesTable
} from '@health/db';
import { asc, eq } from 'drizzle-orm';

import type { ProfileAggregate, ProfileFocusArea, ProfileHighlight, ProfileQuickAction } from './profile.domain.js';

function mapFocusAreaRecord(
  focusArea: typeof profileFocusAreasTable.$inferSelect
): ProfileFocusArea {
  return {
    id: focusArea.id,
    profileId: focusArea.profileId,
    label: focusArea.label,
    progressLabel: focusArea.progressLabel,
    position: focusArea.position
  };
}

function mapHighlightRecord(
  highlight: typeof profileHighlightsTable.$inferSelect
): ProfileHighlight {
  return {
    id: highlight.id,
    profileId: highlight.profileId,
    title: highlight.title,
    description: highlight.description,
    position: highlight.position
  };
}

function mapQuickActionRecord(
  quickAction: typeof profileQuickActionsTable.$inferSelect
): ProfileQuickAction {
  return {
    id: quickAction.id,
    profileId: quickAction.profileId,
    label: quickAction.label,
    description: quickAction.description,
    accent: quickAction.accent,
    position: quickAction.position
  };
}

export async function getProfileByUserId(userId: string): Promise<ProfileAggregate | null> {
  const profileRows = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId))
    .limit(1);

  const profile = profileRows[0];

  if (!profile) {
    return null;
  }

  const [focusAreas, highlights, quickActions] = await Promise.all([
    db
      .select()
      .from(profileFocusAreasTable)
      .where(eq(profileFocusAreasTable.profileId, profile.id))
      .orderBy(asc(profileFocusAreasTable.position)),
    db
      .select()
      .from(profileHighlightsTable)
      .where(eq(profileHighlightsTable.profileId, profile.id))
      .orderBy(asc(profileHighlightsTable.position)),
    db
      .select()
      .from(profileQuickActionsTable)
      .where(eq(profileQuickActionsTable.profileId, profile.id))
      .orderBy(asc(profileQuickActionsTable.position))
  ]);

  return {
    profile: {
      id: profile.id,
      userId: profile.userId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      membershipTier: profile.membershipTier,
      planTitle: profile.planTitle,
      joinedAt: profile.joinedAt,
      nextSessionAt: profile.nextSessionAt,
      streakDays: profile.streakDays,
      completionPercent: profile.completionPercent,
      energyLabel: profile.energyLabel,
      consistencyNote: profile.consistencyNote,
      supportNote: profile.supportNote
    },
    focusAreas: focusAreas.map(mapFocusAreaRecord),
    highlights: highlights.map(mapHighlightRecord),
    quickActions: quickActions.map(mapQuickActionRecord)
  };
}
