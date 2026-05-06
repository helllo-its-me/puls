import { z } from 'zod';

const isoDateTimeStringSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Expected ISO datetime string'
});
const isoDateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const nameSchema = z.string().trim().min(1).max(255);

export const profileGenderSchema = z.enum([
  'female',
  'male',
  'other',
  'prefer_not_to_say'
]);

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
  lastName: z.string(),
  fullName: z.string(),
  birthDate: isoDateStringSchema.nullable(),
  heightCm: z.number().int().min(1).max(300).nullable(),
  weightKg: z.number().int().min(1).max(500).nullable(),
  gender: profileGenderSchema.nullable(),
  membershipTier: z.string(),
  planTitle: z.string(),
  joinedAt: isoDateTimeStringSchema,
  nextSessionAt: isoDateTimeStringSchema,
  streakDays: z.number().int().nonnegative(),
  completionPercent: z.number().int().min(0).max(100),
  energyLabel: z.string(),
  consistencyLabel: z.string(),
  supportLevel: z.string(),
  focusAreas: z.array(profileFocusAreaSchema),
  highlights: z.array(profileHighlightSchema),
  quickActions: z.array(profileQuickActionSchema)
});

export const updateProfileRequestSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  birthDate: isoDateStringSchema.nullable(),
  heightCm: z.number().int().min(1).max(300).nullable(),
  weightKg: z.number().int().min(1).max(500).nullable(),
  gender: profileGenderSchema.nullable()
});
