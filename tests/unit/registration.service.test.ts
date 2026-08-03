import { beforeEach, describe, expect, it, vi } from 'vitest';

const getActiveRegistrationAttemptMock = vi.fn();
const createRegistrationAttemptMock = vi.fn();
const verifyRegistrationAttemptMock = vi.fn();
const clearAuthAccountAttemptsMock = vi.fn();
const consumeAuthAttemptMock = vi.fn();
const releaseAuthNetworkAttemptMock = vi.fn();
const tryConsumeAuthAccountAttemptMock = vi.fn();

vi.mock('../../apps/api/src/features/auth/registration.repository.js', () => ({
  createRegistrationAttempt: createRegistrationAttemptMock,
  getActiveRegistrationAttempt: getActiveRegistrationAttemptMock,
  verifyRegistrationAttempt: verifyRegistrationAttemptMock
}));

vi.mock('../../apps/api/src/features/auth/auth.rate-limit.js', () => ({
  clearAuthAccountAttempts: clearAuthAccountAttemptsMock,
  consumeAuthAttempt: consumeAuthAttemptMock,
  releaseAuthNetworkAttempt: releaseAuthNetworkAttemptMock,
  tryConsumeAuthAccountAttempt: tryConsumeAuthAccountAttemptMock
}));

describe('registration service', () => {
  beforeEach(() => {
    getActiveRegistrationAttemptMock.mockReset();
    createRegistrationAttemptMock.mockReset();
    verifyRegistrationAttemptMock.mockReset();
    clearAuthAccountAttemptsMock.mockReset();
    consumeAuthAttemptMock.mockReset();
    releaseAuthNetworkAttemptMock.mockReset();
    tryConsumeAuthAccountAttemptMock.mockReset();
    consumeAuthAttemptMock.mockResolvedValue(undefined);
    clearAuthAccountAttemptsMock.mockResolvedValue(undefined);
    releaseAuthNetworkAttemptMock.mockResolvedValue(undefined);
    tryConsumeAuthAccountAttemptMock.mockResolvedValue(true);
    createRegistrationAttemptMock.mockResolvedValue(undefined);
    process.env.AUTH_TOKEN_SECRET = 'unit-test-auth-token-secret-value-01';
  });

  it('stores an unverified account and an encrypted verification code', async () => {
    const now = new Date('2026-08-03T10:00:00.000Z');
    const { registerUser } = await import(
      '../../apps/api/src/features/auth/registration.service.js'
    );

    const result = await registerUser({
      email: 'new@example.com',
      password: 'strong-password-value',
      firstName: 'New',
      lastName: 'Member'
    }, '192.0.2.1', 0, now);

    expect(result).toEqual({
      status: 'ok',
      registrationToken: expect.stringMatching(/\S+/)
    });
    expect(createRegistrationAttemptMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@example.com',
        registrationTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        passwordHash: expect.not.stringContaining('strong-password-value'),
        encryptedCode: expect.stringMatching(/\S+/),
        createdAt: now
      })
    );
  });

  it('verifies a valid code and releases the successful network attempt', async () => {
    const { hashPassword } = await import(
      '../../apps/api/src/features/auth/auth.password.js'
    );
    const now = new Date('2026-08-03T10:00:00.000Z');
    getActiveRegistrationAttemptMock.mockResolvedValue({
      id: 'verification-code-id',
      email: 'new@example.com',
      codeHash: await hashPassword('123456'),
      expiresAt: new Date('2026-08-03T10:10:00.000Z')
    });
    verifyRegistrationAttemptMock.mockResolvedValue(true);
    const { verifyRegisteredEmail } = await import(
      '../../apps/api/src/features/auth/registration.service.js'
    );

    await verifyRegisteredEmail(
      {
        email: 'new@example.com',
        code: '123456',
        registrationToken: 'registration-token'
      },
      '192.0.2.1',
      now
    );

    expect(consumeAuthAttemptMock).toHaveBeenCalledWith(
      'registration-verify',
      'network',
      '192.0.2.1',
      now
    );
    expect(getActiveRegistrationAttemptMock).toHaveBeenCalledWith(
      'new@example.com',
      expect.stringMatching(/^[a-f0-9]{64}$/),
      now
    );
    expect(verifyRegistrationAttemptMock).toHaveBeenCalledWith(
      'verification-code-id',
      'new@example.com',
      now
    );
    expect(clearAuthAccountAttemptsMock).toHaveBeenCalledWith(
      'registration-verify',
      'new@example.com'
    );
    expect(releaseAuthNetworkAttemptMock).toHaveBeenCalledWith(
      'registration-verify',
      '192.0.2.1'
    );
  });

  it('counts only failed code checks against the account limit', async () => {
    getActiveRegistrationAttemptMock.mockResolvedValue(null);
    const { verifyRegisteredEmail } = await import(
      '../../apps/api/src/features/auth/registration.service.js'
    );

    await expect(
      verifyRegisteredEmail(
        {
          email: 'new@example.com',
          code: '000000',
          registrationToken: 'registration-token'
        },
        '192.0.2.1'
      )
    ).rejects.toThrow('Invalid or expired email verification code');
    expect(consumeAuthAttemptMock).toHaveBeenCalledWith(
      'registration-verify',
      'account',
      'new@example.com',
      expect.any(Date)
    );
    expect(releaseAuthNetworkAttemptMock).not.toHaveBeenCalled();
  });

  it('stops before code lookup when the network limit is exceeded', async () => {
    consumeAuthAttemptMock.mockRejectedValueOnce(new Error('rate limited'));
    const { verifyRegisteredEmail } = await import(
      '../../apps/api/src/features/auth/registration.service.js'
    );

    await expect(
      verifyRegisteredEmail(
        {
          email: 'new@example.com',
          code: '123456',
          registrationToken: 'registration-token'
        },
        '192.0.2.1'
      )
    ).rejects.toThrow('rate limited');
    expect(getActiveRegistrationAttemptMock).not.toHaveBeenCalled();
  });

  it('returns a generic token without creating an attempt after the email limit', async () => {
    tryConsumeAuthAccountAttemptMock.mockResolvedValue(false);
    const { registerUser } = await import(
      '../../apps/api/src/features/auth/registration.service.js'
    );

    await expect(registerUser({
      email: 'limited@example.com',
      password: 'strong-password-value',
      firstName: 'Rate',
      lastName: 'Limited'
    }, '192.0.2.1', 0)).resolves.toMatchObject({
      status: 'ok',
      registrationToken: expect.stringMatching(/\S+/)
    });
    expect(createRegistrationAttemptMock).not.toHaveBeenCalled();
  });
});
