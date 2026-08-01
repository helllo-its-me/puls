import { describe, expect, it } from 'vitest';

import { parsePublicEnv } from '../../apps/mobile/src/config/parse-public-env';

describe('parsePublicEnv', () => {
  it('normalizes a valid API base URL', () => {
    expect(
      parsePublicEnv({
        EXPO_PUBLIC_API_BASE_URL: 'https://api.example.com/'
      })
    ).toEqual({ apiBaseUrl: 'https://api.example.com' });
  });

  it('rejects a missing API base URL', () => {
    expect(() =>
      parsePublicEnv({
        EXPO_PUBLIC_API_BASE_URL: undefined
      })
    ).toThrow();
  });
});
