import { beforeEach, describe, expect, it, vi } from 'vitest';

const incrementAuthRateLimitMock = vi.fn();
const clearAuthRateLimitMock = vi.fn();
const releaseAuthRateLimitMock = vi.fn();

vi.mock('../../apps/api/src/features/auth/auth.rate-limit.repository.js', () => ({
  clearAuthRateLimit: clearAuthRateLimitMock,
  incrementAuthRateLimit: incrementAuthRateLimitMock,
  releaseAuthRateLimit: releaseAuthRateLimitMock
}));

describe('auth rate limit', () => {
  beforeEach(() => {
    incrementAuthRateLimitMock.mockReset();
    clearAuthRateLimitMock.mockReset();
    releaseAuthRateLimitMock.mockReset();
  });

  it('blocks login attempts beyond the account limit and returns retry timing', async () => {
    const now = new Date('2026-08-01T10:10:00.000Z');
    incrementAuthRateLimitMock.mockResolvedValue({
      attempts: 11,
      windowStartedAt: new Date('2026-08-01T10:00:00.000Z')
    });
    const { consumeAuthAttempt } = await import(
      '../../apps/api/src/features/auth/auth.rate-limit.js'
    );

    await expect(
      consumeAuthAttempt('login', 'account', 'user@example.com', now)
    ).rejects.toMatchObject({ retryAfterSeconds: 5 * 60 });
  });

  it('uses separate non-reversible keys for separate auth actions and scopes', async () => {
    const now = new Date('2026-08-01T10:00:00.000Z');
    incrementAuthRateLimitMock.mockResolvedValue({
      attempts: 1,
      windowStartedAt: now
    });
    const { consumeAuthAttempt } = await import(
      '../../apps/api/src/features/auth/auth.rate-limit.js'
    );

    await consumeAuthAttempt('login', 'account', 'user@example.com', now);
    await consumeAuthAttempt('password-reset-request', 'account', 'user@example.com', now);
    await consumeAuthAttempt('login', 'network', '192.0.2.1', now);

    const loginKey: string | undefined = incrementAuthRateLimitMock.mock.calls[0]?.[0];
    const passwordResetKey: string | undefined = incrementAuthRateLimitMock.mock.calls[1]?.[0];
    const networkKey: string | undefined = incrementAuthRateLimitMock.mock.calls[2]?.[0];

    expect(loginKey).toMatch(/^[a-f0-9]{64}$/);
    expect(passwordResetKey).toMatch(/^[a-f0-9]{64}$/);
    expect(networkKey).toMatch(/^[a-f0-9]{64}$/);
    expect(loginKey).not.toBe(passwordResetKey);
    expect(loginKey).not.toBe(networkKey);
  });

  it('releases the network slot after a successful authentication', async () => {
    const { releaseAuthNetworkAttempt } = await import(
      '../../apps/api/src/features/auth/auth.rate-limit.js'
    );

    await releaseAuthNetworkAttempt('login', '192.0.2.1');

    expect(releaseAuthRateLimitMock).toHaveBeenCalledWith(
      expect.stringMatching(/^[a-f0-9]{64}$/)
    );
  });

  it('turns an exhausted email policy into a generic denied action', async () => {
    incrementAuthRateLimitMock.mockResolvedValue({
      attempts: 4,
      windowStartedAt: new Date('2026-08-03T10:00:00.000Z')
    });
    const { tryConsumeAuthAccountAttempt } = await import(
      '../../apps/api/src/features/auth/auth.rate-limit.js'
    );

    await expect(tryConsumeAuthAccountAttempt(
      'password-reset-request',
      'user@example.com',
      new Date('2026-08-03T10:01:00.000Z')
    )).resolves.toBe(false);
  });
});
