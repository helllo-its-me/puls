import { z } from 'zod';

export const profileFocusAreaSchema = z.object({
  id: z.string(),
  label: z.string(),
  progressLabel: z.string()
});

export const profileHighlightSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string()
});

export const profileQuickActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  accent: z.enum(['mint', 'sky', 'lavender'])
});

export const profileResponseSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  fullName: z.string(),
  membershipTier: z.string(),
  planTitle: z.string(),
  joinedAtLabel: z.string(),
  nextSessionLabel: z.string(),
  streakDays: z.number().int().nonnegative(),
  completionPercent: z.number().int().min(0).max(100),
  energyLabel: z.string(),
  consistencyLabel: z.string(),
  supportLevel: z.string(),
  focusAreas: z.array(profileFocusAreaSchema),
  highlights: z.array(profileHighlightSchema),
  quickActions: z.array(profileQuickActionSchema)
});
