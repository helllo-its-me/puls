import type { z } from 'zod';

import type {
  profileFocusAreaSchema,
  profileGenderSchema,
  profileHighlightSchema,
  profileQuickActionSchema,
  profileResponseSchema,
  updateProfileRequestSchema
} from './schemas';

export type ProfileGender = z.infer<typeof profileGenderSchema>;
export type ProfileFocusArea = z.infer<typeof profileFocusAreaSchema>;
export type ProfileHighlight = z.infer<typeof profileHighlightSchema>;
export type ProfileQuickAction = z.infer<typeof profileQuickActionSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
