import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  passwordResetCodeTtlSeconds,
  passwordResetSessionTtlSeconds
} from '../../packages/shared/src/auth/constants.js';

const millisecondsPerSecond = 1000;
const completePasswordResetByTokenHashMock = vi.fn();
const createOrReusePasswordResetCodeWithEmailJobMock = vi.fn();
const getLatestActivePasswordResetCodeMock = vi.fn();
const hasActivePasswordResetTokenHashMock = vi.fn();
const markPasswordResetCodeVerifiedMock = vi.fn();
const consumeAuthAttemptMock = vi.fn();
const clearAuthAccountAttemptsMock = vi.fn();
const releaseAuthNetworkAttemptMock = vi.fn();
const tryConsumeAuthAccountAttemptMock = vi.fn();

vi.mock('../../apps/api/src/features/auth/password-reset.repository.js', () => ({
  completePasswordResetByTokenHash: completePasswordResetByTokenHashMock,
  createOrReusePasswordResetCodeWithEmailJob:
    createOrReusePasswordResetCodeWithEmailJobMock,
  getLatestActivePasswordResetCode: getLatestActivePasswordResetCodeMock,
  hasActivePasswordResetTokenHash: hasActivePasswordResetTokenHashMock,
  markPasswordResetCodeVerified: markPasswordResetCodeVerifiedMock
}));

vi.mock('../../apps/api/src/features/auth/auth.rate-limit.js', () => ({
  clearAuthAccountAttempts: clearAuthAccountAttemptsMock,
  consumeAuthAttempt: consumeAuthAttemptMock,
  releaseAuthNetworkAttempt: releaseAuthNetworkAttemptMock,
  tryConsumeAuthAccountAttempt: tryConsumeAuthAccountAttemptMock
}));

describe('password reset service', () => {
  beforeEach(() => {
    completePasswordResetByTokenHashMock.mockReset();
    createOrReusePasswordResetCodeWithEmailJobMock.mockReset();
    getLatestActivePasswordResetCodeMock.mockReset();
    hasActivePasswordResetTokenHashMock.mockReset();
    markPasswordResetCodeVerifiedMock.mockReset();
    consumeAuthAttemptMock.mockReset();
    clearAuthAccountAttemptsMock.mockReset();
    releaseAuthNetworkAttemptMock.mockReset();
    tryConsumeAuthAccountAttemptMock.mockReset();
    consumeAuthAttemptMock.mockResolvedValue(undefined);
    clearAuthAccountAttemptsMock.mockResolvedValue(undefined);
    releaseAuthNetworkAttemptMock.mockResolvedValue(undefined);
    tryConsumeAuthAccountAttemptMock.mockResolvedValue(true);
    markPasswordResetCodeVerifiedMock.mockResolvedValue(true);
    hasActivePasswordResetTokenHashMock.mockResolvedValue(true);
    process.env.AUTH_TOKEN_SECRET = 'unit-test-auth-token-secret-value-01';
  });

  it('does not reveal missing users when requesting a reset code', async () => {
    createOrReusePasswordResetCodeWithEmailJobMock.mockResolvedValue(null);

    const { requestPasswordReset } = await import(
      '../../apps/api/src/features/auth/password-reset.service.js'
    );

    await requestPasswordReset(
      { email: 'missing@example.com' },
      '192.0.2.1',
      0
    );

    expect(tryConsumeAuthAccountAttemptMock).toHaveBeenCalledWith(
      'password-reset-request',
      'missing@example.com',
      expect.any(Date)
    );
    expect(createOrReusePasswordResetCodeWithEmailJobMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'missing@example.com' }),
      expect.objectContaining({ email: 'missing@example.com' })
    );
  });

  it('creates a reset code with the shared ttl for an existing user', async () => {
    createOrReusePasswordResetCodeWithEmailJobMock.mockResolvedValue(undefined);

    const { requestPasswordReset } = await import(
      '../../apps/api/src/features/auth/password-reset.service.js'
    );

    const result = await requestPasswordReset(
      { email: 'user@example.com' },
      '192.0.2.1',
      0
    );

    expect(createOrReusePasswordResetCodeWithEmailJobMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@example.com' }),
      expect.objectContaining({
        email: 'user@example.com',
        kind: 'reset-code',
        encryptedCode: expect.not.stringContaining('undefined')
      })
    );

    const createdAt: Date | undefined =
      createOrReusePasswordResetCodeWithEmailJobMock.mock.calls[0]?.[0]?.createdAt;
    const expiresAt: Date | undefined =
      createOrReusePasswordResetCodeWithEmailJobMock.mock.calls[0]?.[0]?.expiresAt;

    expect(createdAt).toBeInstanceOf(Date);
    expect(expiresAt).toBeInstanceOf(Date);
    expect(expiresAt && createdAt ? expiresAt.getTime() - createdAt.getTime() : 0).toBe(
      passwordResetCodeTtlSeconds * millisecondsPerSecond
    );
    expect(result.expiresAt).toBe(expiresAt?.toISOString());
  });

  it('atomically verifies a valid reset code', async () => {
    const { hashPassword } = await import(
      '../../apps/api/src/features/auth/auth.password.js'
    );
    const now = new Date('2026-05-02T10:00:00.000Z');

    getLatestActivePasswordResetCodeMock.mockResolvedValue({
      id: 'reset-code-id',
      email: 'user@example.com',
      codeHash: await hashPassword('123456'),
      encryptedCode: null,
      expiresAt: new Date('2026-05-02T10:01:00.000Z'),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      verifiedAt: null,
      usedAt: null,
      createdAt: now
    });

    const { verifyPasswordResetCode } = await import(
      '../../apps/api/src/features/auth/password-reset.service.js'
    );
    const result = await verifyPasswordResetCode(
      { email: 'user@example.com', code: '123456' },
      '192.0.2.1',
      now
    );

    expect(result.resetToken).toMatch(/\S+/);
    expect(markPasswordResetCodeVerifiedMock).toHaveBeenCalledWith(
      'reset-code-id',
      now,
      expect.stringMatching(/\S+/),
      new Date(now.getTime() + passwordResetSessionTtlSeconds * millisecondsPerSecond)
    );
    expect(clearAuthAccountAttemptsMock).toHaveBeenCalledWith(
      'password-reset-verify',
      'user@example.com'
    );
    expect(consumeAuthAttemptMock).toHaveBeenCalledWith(
      'password-reset-verify',
      'network',
      '192.0.2.1',
      expect.any(Date)
    );
    expect(releaseAuthNetworkAttemptMock).toHaveBeenCalledWith(
      'password-reset-verify',
      '192.0.2.1'
    );
  });

  it('rejects an invalid reset code', async () => {
    const { hashPassword } = await import(
      '../../apps/api/src/features/auth/auth.password.js'
    );

    getLatestActivePasswordResetCodeMock.mockResolvedValue({
      id: 'reset-code-id',
      email: 'user@example.com',
      codeHash: await hashPassword('123456'),
      encryptedCode: null,
      expiresAt: new Date('2026-05-02T10:01:00.000Z'),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      verifiedAt: null,
      usedAt: null,
      createdAt: new Date('2026-05-02T10:00:00.000Z')
    });

    const { verifyPasswordResetCode } = await import(
      '../../apps/api/src/features/auth/password-reset.service.js'
    );

    await expect(
      verifyPasswordResetCode(
        { email: 'user@example.com', code: '000000' },
        '192.0.2.1'
      )
    ).rejects.toThrow('Invalid or expired reset code');
    expect(consumeAuthAttemptMock).toHaveBeenCalledWith(
      'password-reset-verify',
      'network',
      '192.0.2.1',
      expect.any(Date)
    );
    expect(consumeAuthAttemptMock).toHaveBeenCalledWith(
      'password-reset-verify',
      'account',
      'user@example.com',
      expect.any(Date)
    );
    expect(clearAuthAccountAttemptsMock).not.toHaveBeenCalled();
  });

  it('stops verification before password hashing when the network limit is exceeded', async () => {
    consumeAuthAttemptMock.mockRejectedValueOnce(new Error('rate limited'));

    const { verifyPasswordResetCode } = await import(
      '../../apps/api/src/features/auth/password-reset.service.js'
    );

    await expect(
      verifyPasswordResetCode(
        { email: 'user@example.com', code: '123456' },
        '192.0.2.1'
      )
    ).rejects.toThrow('rate limited');
    expect(getLatestActivePasswordResetCodeMock).not.toHaveBeenCalled();
  });

  it('rejects a code that another request verified first', async () => {
    const { hashPassword } = await import(
      '../../apps/api/src/features/auth/auth.password.js'
    );

    getLatestActivePasswordResetCodeMock.mockResolvedValue({
      id: 'reset-code-id',
      email: 'user@example.com',
      codeHash: await hashPassword('123456'),
      encryptedCode: null,
      expiresAt: new Date('2026-05-02T10:01:00.000Z'),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      verifiedAt: null,
      usedAt: null,
      createdAt: new Date('2026-05-02T10:00:00.000Z')
    });
    markPasswordResetCodeVerifiedMock.mockResolvedValue(false);

    const { verifyPasswordResetCode } = await import(
      '../../apps/api/src/features/auth/password-reset.service.js'
    );

    await expect(
      verifyPasswordResetCode(
        { email: 'user@example.com', code: '123456' },
        '192.0.2.1'
      )
    ).rejects.toThrow('Invalid or expired reset code');
  });

  it('returns generic success without creating mail after the email limit', async () => {
    tryConsumeAuthAccountAttemptMock.mockResolvedValue(false);
    const now = new Date('2026-08-03T10:00:00.000Z');
    const { requestPasswordReset } = await import(
      '../../apps/api/src/features/auth/password-reset.service.js'
    );

    await expect(requestPasswordReset(
      { email: 'limited@example.com' },
      '192.0.2.1',
      0,
      now
    )).resolves.toEqual({
      status: 'ok',
      expiresAt: '2026-08-03T10:10:00.000Z'
    });
    expect(createOrReusePasswordResetCodeWithEmailJobMock).not.toHaveBeenCalled();
  });

  it('atomically updates the password and consumes the verified reset token', async () => {
    completePasswordResetByTokenHashMock.mockResolvedValue(true);
    const now = new Date('2026-05-02T10:00:30.000Z');

    const { completePasswordReset } = await import(
      '../../apps/api/src/features/auth/password-reset.service.js'
    );

    await completePasswordReset(
      {
        resetToken: 'verified-reset-token',
        password: 'new-password-value',
        passwordConfirmation: 'new-password-value'
      },
      now
    );

    expect(completePasswordResetByTokenHashMock).toHaveBeenCalledWith(
      expect.stringMatching(/\S+/),
      expect.not.stringContaining('new-password-value'),
      expect.stringMatching(/\S+/),
      now
    );
  });

  it('rejects password reset completion without a verified reset token', async () => {
    hasActivePasswordResetTokenHashMock.mockResolvedValue(false);

    const { completePasswordReset } = await import(
      '../../apps/api/src/features/auth/password-reset.service.js'
    );

    await expect(
      completePasswordReset({
        resetToken: 'missing-reset-token',
        password: 'new-password-value',
        passwordConfirmation: 'new-password-value'
      })
    ).rejects.toThrow('Invalid or expired password reset session');
    expect(completePasswordResetByTokenHashMock).not.toHaveBeenCalled();
  });
});
