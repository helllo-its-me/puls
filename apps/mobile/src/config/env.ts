import { parsePublicEnv } from '@/config/parse-public-env';

export const env = parsePublicEnv({
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL
});
