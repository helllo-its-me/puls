import { createHmac } from 'node:crypto';

import { afterEach, describe, expect, it, vi } from 'vitest';

describe('auth token', () => {
  afterEach(() => {
    delete process.env.AUTH_TOKEN_SECRET;
    delete process.env.AUTH_TOKEN_PREVIOUS_SECRETS;
    process.env.NODE_ENV = 'test';
    vi.useRealTimers();
  });

  it('requires the current auth token secret', async () => {
    const { assertAuthTokenConfig } = await import('../../apps/api/src/features/auth/auth.token.js');

    expect(() => assertAuthTokenConfig()).toThrow('AUTH_TOKEN_SECRET is required');
  });

  it('rejects auth token secrets that are too short', async () => {
    process.env.AUTH_TOKEN_SECRET = 'short-secret';
    const { assertAuthTokenConfig } = await import(
      '../../apps/api/src/features/auth/auth.token.js'
    );

    expect(() => assertAuthTokenConfig()).toThrow('at least 32 characters');
  });

  it('rejects a readable placeholder outside local environments', async () => {
    process.env.NODE_ENV = 'staging';
    process.env.AUTH_TOKEN_SECRET = 'replace-with-a-local-development-secret';
    const { assertAuthTokenConfig } = await import(
      '../../apps/api/src/features/auth/auth.token.js'
    );

    expect(() => assertAuthTokenConfig()).toThrow('exactly 32 random bytes');
  });

  it('accepts a 32-byte encoded secret outside local environments', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_TOKEN_SECRET = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const { assertAuthTokenConfig } = await import(
      '../../apps/api/src/features/auth/auth.token.js'
    );

    expect(() => assertAuthTokenConfig()).not.toThrow();
  });

  it('verifies a token signed with the current secret', async () => {
    process.env.AUTH_TOKEN_SECRET = 'current-auth-token-secret-value-0001';

    const { createAccessToken, verifyAccessToken } = await import(
      '../../apps/api/src/features/auth/auth.token.js'
    );
    const token = createAccessToken({
      id: 'user-primary',
      authVersion: 3
    });
    const payload = verifyAccessToken(token);

    expect(payload).toMatchObject({
      sub: 'user-primary',
      av: 3
    });
  });

  it('accepts tokens signed with previous secrets during rotation', async () => {
    process.env.AUTH_TOKEN_SECRET = 'previous-auth-token-secret-value-01';

    const { createAccessToken, verifyAccessToken } = await import(
      '../../apps/api/src/features/auth/auth.token.js'
    );
    const token = createAccessToken({
      id: 'user-primary',
      authVersion: 0
    });

    process.env.AUTH_TOKEN_SECRET = 'current-auth-token-secret-value-0001';
    process.env.AUTH_TOKEN_PREVIOUS_SECRETS = 'previous-auth-token-secret-value-01';

    expect(verifyAccessToken(token)?.sub).toBe('user-primary');
  });

  it('rejects expired access tokens', async () => {
    process.env.AUTH_TOKEN_SECRET = 'current-auth-token-secret-value-0001';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-06T10:00:00.000Z'));

    const { createAccessToken, verifyAccessToken } = await import(
      '../../apps/api/src/features/auth/auth.token.js'
    );
    const token = createAccessToken({
      id: 'user-primary',
      authVersion: 0
    });

    vi.setSystemTime(new Date('2026-05-06T11:00:01.000Z'));

    expect(verifyAccessToken(token)).toBeNull();
  });

  it('rejects a correctly signed token with an unexpected algorithm header', async () => {
    const secret = 'current-auth-token-secret-value-0001';
    process.env.AUTH_TOKEN_SECRET = secret;
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      sub: 'user-primary',
      av: 0,
      exp: Math.floor(Date.now() / 1000) + 60
    })).toString('base64url');
    const unsignedToken = `${header}.${payload}`;
    const signature = createHmac('sha256', secret)
      .update(unsignedToken)
      .digest('base64url');
    const { verifyAccessToken } = await import(
      '../../apps/api/src/features/auth/auth.token.js'
    );

    expect(verifyAccessToken(`${unsignedToken}.${signature}`)).toBeNull();
  });
});
