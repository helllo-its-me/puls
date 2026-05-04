import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  passwordResetCodeTtlSeconds,
  passwordResetSessionTtlSeconds
} from '../../packages/shared/src/auth/constants.js';

const millisecondsPerSecond = 1000;

const createPasswordResetCodeMock = vi.fn();
const getActivePasswordResetCodeByTokenHashMock = vi.fn();
const getLatestActivePasswordResetCodeMock = vi.fn();
const markPasswordResetCodeUsedMock = vi.fn();
const markPasswordResetCodeVerifiedMock = vi.fn();
const updateUserPasswordByEmailMock = vi.fn();
const userExistsByEmailMock = vi.fn();

vi.mock('../../apps/api/src/features/auth/password-reset.repository.js', () => ({
  createPasswordResetCode: createPasswordResetCodeMock,
  getActivePasswordResetCodeByTokenHash: getActivePasswordResetCodeByTokenHashMock,
  getLatestActivePasswordResetCode: getLatestActivePasswordResetCodeMock,
  markPasswordResetCodeUsed: markPasswordResetCodeUsedMock,
  markPasswordResetCodeVerified: markPasswordResetCodeVerifiedMock,
  updateUserPasswordByEmail: updateUserPasswordByEmailMock,
  userExistsByEmail: userExistsByEmailMock
}));

describe('password reset service', () => {
  beforeEach(() => {
    createPasswordResetCodeMock.mockReset();
    getActivePasswordResetCodeByTokenHashMock.mockReset();
    getLatestActivePasswordResetCodeMock.mockReset();
    markPasswordResetCodeUsedMock.mockReset();
    markPasswordResetCodeVerifiedMock.mockReset();
    updateUserPasswordByEmailMock.mockReset();
    userExistsByEmailMock.mockReset();
  });

  it('does not reveal missing users when requesting a reset code', async () => {
    userExistsByEmailMock.mockResolvedValue(false);
    const emailSender = {
      sendPasswordResetCode: vi.fn()
    };

    const { requestPasswordReset } = await import(
      '../../apps/api/src/features/auth/password-reset.service.js'
    );

    await requestPasswordReset({ email: 'missing@example.com' }, emailSender);

    expect(createPasswordResetCodeMock).not.toHaveBeenCalled();
    expect(emailSender.sendPasswordResetCode).not.toHaveBeenCalled();
  });

  it('creates a reset code with the shared ttl for an existing user', async () => {
    userExistsByEmailMock.mockResolvedValue(true);
    const emailSender = {
      sendPasswordResetCode: vi.fn()
    };

    const { requestPasswordReset } = await import(
      '../../apps/api/src/features/auth/password-reset.service.js'
    );

    await requestPasswordReset({ email: 'user@example.com' }, emailSender);

    expect(createPasswordResetCodeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com'
      })
    );

    const createdAt: Date | undefined = createPasswordResetCodeMock.mock.calls[0]?.[0]?.createdAt;
    const expiresAt: Date | undefined = createPasswordResetCodeMock.mock.calls[0]?.[0]?.expiresAt;

    expect(createdAt).toBeInstanceOf(Date);
    expect(expiresAt).toBeInstanceOf(Date);
    expect(expiresAt && createdAt ? expiresAt.getTime() - createdAt.getTime() : 0).toBe(
      passwordResetCodeTtlSeconds * millisecondsPerSecond
    );
    expect(emailSender.sendPasswordResetCode).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com'
      })
    );
  });

  it('verifies a valid reset code', async () => {
    const { hashPassword } = await import('../../apps/api/src/features/auth/auth.password.js');
    const now = new Date('2026-05-02T10:00:00.000Z');

    getLatestActivePasswordResetCodeMock.mockResolvedValue({
      id: 'reset-code-id',
      email: 'user@example.com',
      codeHash: await hashPassword('123456'),
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
      {
        email: 'user@example.com',
        code: '123456'
      },
      now
    );

    expect(result.resetToken).toMatch(/\S+/);
    expect(markPasswordResetCodeVerifiedMock).toHaveBeenCalledWith(
      'reset-code-id',
      now,
      expect.stringMatching(/\S+/),
      new Date(now.getTime() + passwordResetSessionTtlSeconds * millisecondsPerSecond)
    );
  });

  it('rejects an invalid reset code', async () => {
    const { hashPassword } = await import('../../apps/api/src/features/auth/auth.password.js');

    getLatestActivePasswordResetCodeMock.mockResolvedValue({
      id: 'reset-code-id',
      email: 'user@example.com',
      codeHash: await hashPassword('123456'),
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
      verifyPasswordResetCode({
        email: 'user@example.com',
        code: '000000'
      })
    ).rejects.toThrow('Invalid or expired reset code');
  });

  it('updates password with a verified reset token after the code expires', async () => {
    const now = new Date('2026-05-02T10:00:30.000Z');

    getActivePasswordResetCodeByTokenHashMock.mockResolvedValue({
      id: 'reset-code-id',
      email: 'user@example.com',
      codeHash: 'hashed-code',
      expiresAt: new Date('2026-05-02T10:00:10.000Z'),
      resetTokenHash: 'hashed-reset-token',
      resetTokenExpiresAt: new Date('2026-05-02T10:10:20.000Z'),
      verifiedAt: new Date('2026-05-02T10:00:20.000Z'),
      usedAt: null,
      createdAt: new Date('2026-05-02T10:00:00.000Z')
    });

    const { completePasswordReset } = await import(
      '../../apps/api/src/features/auth/password-reset.service.js'
    );

    await completePasswordReset(
      {
        resetToken: 'verified-reset-token',
        password: 'new-password',
        passwordConfirmation: 'new-password'
      },
      now
    );

    expect(updateUserPasswordByEmailMock).toHaveBeenCalledWith(
      'user@example.com',
      expect.not.stringContaining('new-password')
    );
    expect(markPasswordResetCodeUsedMock).toHaveBeenCalledWith('reset-code-id', now);
  });

  it('rejects password reset completion without a verified reset token', async () => {
    getActivePasswordResetCodeByTokenHashMock.mockResolvedValue(null);

    const { completePasswordReset } = await import(
      '../../apps/api/src/features/auth/password-reset.service.js'
    );

    await expect(
      completePasswordReset({
        resetToken: 'missing-reset-token',
        password: 'new-password',
        passwordConfirmation: 'new-password'
      })
    ).rejects.toThrow('Invalid or expired password reset session');
  });
});
