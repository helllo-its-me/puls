import { config } from 'dotenv';

import { parsePublicEnv } from '../src/config/parse-public-env.js';

if (process.env.EXPO_NO_DOTENV !== '1') {
  config({ quiet: true });
}

parsePublicEnv({
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL
});
