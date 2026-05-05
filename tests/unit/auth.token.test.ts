import { afterEach, describe, expect, it, vi } from 'vitest';

describe('auth token', () => {
  afterEach(() => {
    delete process.env.AUTH_TOKEN_SECRET;
    delete process.env.AUTH_TOKEN_PREVIOUS_SECRETS;
    vi.useRealTimers();
  });

  it('requires the current auth token secret', async () => {
    const { assertAuthTokenConfig } = await import('../../apps/api/src/features/auth/auth.token.js');

    expect(() => assertAuthTokenConfig()).toThrow('AUTH_TOKEN_SECRET is required');
  });

  it('verifies a token signed with the current secret', async () => {
    process.env.AUTH_TOKEN_SECRET = 'current-secret';

    const { createAccessToken, verifyAccessToken } = await import(
      '../../apps/api/src/features/auth/auth.token.js'
    );
    const token = createAccessToken({
      id: 'user-primary',
      email: 'tanya@example.com'
    });
    const payload = verifyAccessToken(token);

    expect(payload).toMatchObject({
      sub: 'user-primary',
      email: 'tanya@example.com'
    });
  });

  it('accepts tokens signed with previous secrets during rotation', async () => {
    process.env.AUTH_TOKEN_SECRET = 'old-secret';

    const { createAccessToken, verifyAccessToken } = await import(
      '../../apps/api/src/features/auth/auth.token.js'
    );
    const token = createAccessToken({
      id: 'user-primary',
      email: 'tanya@example.com'
    });

    process.env.AUTH_TOKEN_SECRET = 'new-secret';
    process.env.AUTH_TOKEN_PREVIOUS_SECRETS = 'old-secret';

    expect(verifyAccessToken(token)?.sub).toBe('user-primary');
  });

  it('rejects expired access tokens', async () => {
    process.env.AUTH_TOKEN_SECRET = 'current-secret';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-06T10:00:00.000Z'));

    const { createAccessToken, verifyAccessToken } = await import(
      '../../apps/api/src/features/auth/auth.token.js'
    );
    const token = createAccessToken({
      id: 'user-primary',
      email: 'tanya@example.com'
    });

    vi.setSystemTime(new Date('2026-05-06T11:00:01.000Z'));

    expect(verifyAccessToken(token)).toBeNull();
  });
});
