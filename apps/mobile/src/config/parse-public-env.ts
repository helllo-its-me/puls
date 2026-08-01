import { z } from 'zod';

type PublicEnvInput = {
  EXPO_PUBLIC_API_BASE_URL: string | undefined;
};

const publicEnvSchema = z.object({
  EXPO_PUBLIC_API_BASE_URL: z
    .string()
    .min(1, 'EXPO_PUBLIC_API_BASE_URL is required')
    .url('EXPO_PUBLIC_API_BASE_URL must be a valid URL')
});

function normalizeApiBaseUrl(apiBaseUrl: string): string {
  return apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
}

export function parsePublicEnv(input: PublicEnvInput) {
  const parsedEnv = publicEnvSchema.parse(input);

  return {
    apiBaseUrl: normalizeApiBaseUrl(parsedEnv.EXPO_PUBLIC_API_BASE_URL)
  } as const;
}
