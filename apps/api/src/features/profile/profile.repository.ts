import {
  db,
  profileFocusAreasTable,
  profileHighlightsTable,
  profileQuickActionsTable,
  profilesTable
} from '@health/db';
import { asc, eq } from 'drizzle-orm';

export type ProfileRecord = {
  profile: typeof profilesTable.$inferSelect;
  focusAreas: typeof profileFocusAreasTable.$inferSelect[];
  highlights: typeof profileHighlightsTable.$inferSelect[];
  quickActions: typeof profileQuickActionsTable.$inferSelect[];
};

export async function getProfileRecordByUserId(userId: string): Promise<ProfileRecord | null> {
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
    profile,
    focusAreas,
    highlights,
    quickActions
  };
}
