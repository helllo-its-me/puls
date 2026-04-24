import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_API_BASE_URL: z
    .string()
    .min(1, 'EXPO_PUBLIC_API_BASE_URL is required')
    .url('EXPO_PUBLIC_API_BASE_URL must be a valid URL')
});

function normalizeApiBaseUrl(apiBaseUrl: string): string {
  return apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
}

const parsedEnv = envSchema.parse({
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL
});

export const env = {
  apiBaseUrl: normalizeApiBaseUrl(parsedEnv.EXPO_PUBLIC_API_BASE_URL)
} as const;
