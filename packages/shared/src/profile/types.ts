import type { z } from 'zod';

import type {
  profileFocusAreaSchema,
  profileHighlightSchema,
  profileQuickActionSchema,
  profileResponseSchema
} from './schemas';

export type ProfileFocusArea = z.infer<typeof profileFocusAreaSchema>;
export type ProfileHighlight = z.infer<typeof profileHighlightSchema>;
export type ProfileQuickAction = z.infer<typeof profileQuickActionSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
