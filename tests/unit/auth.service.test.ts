import { beforeEach, describe, expect, it, vi } from 'vitest';

const createRefreshSessionMock = vi.fn();
const getUserCredentialsByEmailMock = vi.fn();
const revokeRefreshSessionFamilyByTokenHashMock = vi.fn();
const rotateRefreshSessionMock = vi.fn();
const updateUserPasswordHashIfCurrentMock = vi.fn();
const consumeAuthAttemptMock = vi.fn();
const clearAuthAccountAttemptsMock = vi.fn();
const releaseAuthNetworkAttemptMock = vi.fn();

vi.mock('../../apps/api/src/features/auth/auth.repository.js', () => ({
  createRefreshSession: createRefreshSessionMock,
  getUserCredentialsByEmail: getUserCredentialsByEmailMock,
  revokeRefreshSessionFamilyByTokenHash: revokeRefreshSessionFamilyByTokenHashMock,
  rotateRefreshSession: rotateRefreshSessionMock,
  updateUserPasswordHashIfCurrent: updateUserPasswordHashIfCurrentMock
}));

vi.mock('../../apps/api/src/features/auth/auth.rate-limit.js', () => ({
  clearAuthAccountAttempts: clearAuthAccountAttemptsMock,
  consumeAuthAttempt: consumeAuthAttemptMock,
  releaseAuthNetworkAttempt: releaseAuthNetworkAttemptMock
}));

describe('auth service', () => {
  beforeEach(() => {
    process.env.AUTH_TOKEN_SECRET = 'unit-test-auth-token-secret-value-01';
    createRefreshSessionMock.mockReset();
    getUserCredentialsByEmailMock.mockReset();
    revokeRefreshSessionFamilyByTokenHashMock.mockReset();
    rotateRefreshSessionMock.mockReset();
    updateUserPasswordHashIfCurrentMock.mockReset();
    consumeAuthAttemptMock.mockReset();
    clearAuthAccountAttemptsMock.mockReset();
    releaseAuthNetworkAttemptMock.mockReset();
    consumeAuthAttemptMock.mockResolvedValue(undefined);
    clearAuthAccountAttemptsMock.mockResolvedValue(undefined);
    releaseAuthNetworkAttemptMock.mockResolvedValue(undefined);
  });

  it('logs in an existing user with a valid password', async () => {
    const { hashPassword } = await import(
      '../../apps/api/src/features/auth/auth.password.js'
    );
    const { loginUser } = await import(
      '../../apps/api/src/features/auth/auth.service.js'
    );
    const passwordHash = await hashPassword('strong-password');

    getUserCredentialsByEmailMock.mockResolvedValue({
      id: 'user-primary',
      email: 'tanya@example.com',
      authVersion: 2,
      passwordHash
    });

    const result = await loginUser(
      {
        email: 'tanya@example.com',
        password: 'strong-password'
      },
      '192.0.2.1'
    );

    expect(result.user).toEqual({
      id: 'user-primary',
      email: 'tanya@example.com'
    });
    expect(consumeAuthAttemptMock).toHaveBeenCalledWith(
      'login',
      'network',
      '192.0.2.1'
    );
    expect(clearAuthAccountAttemptsMock).toHaveBeenCalledWith(
      'login',
      'tanya@example.com'
    );
    expect(releaseAuthNetworkAttemptMock).toHaveBeenCalledWith(
      'login',
      '192.0.2.1'
    );
    expect(updateUserPasswordHashIfCurrentMock).not.toHaveBeenCalled();
    expect(createRefreshSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        authVersion: 2,
        familyId: expect.stringMatching(/\S+/),
        userId: 'user-primary'
      })
    );
    const createdSession = createRefreshSessionMock.mock.calls[0]?.[0];

    expect(createdSession?.familyId).toBe(createdSession?.id);
  });

  it('rejects a throttled network before loading credentials or running scrypt', async () => {
    consumeAuthAttemptMock.mockRejectedValue(new Error('network throttled'));
    const { loginUser } = await import(
      '../../apps/api/src/features/auth/auth.service.js'
    );

    await expect(loginUser({
      email: 'user@example.com',
      password: 'strong-password'
    }, '192.0.2.1')).rejects.toThrow('network throttled');
    expect(getUserCredentialsByEmailMock).not.toHaveBeenCalled();
  });

  it('rejects login when credentials are invalid after doing password work', async () => {
    getUserCredentialsByEmailMock.mockResolvedValue(null);

    const { loginUser } = await import(
      '../../apps/api/src/features/auth/auth.service.js'
    );

    await expect(
      loginUser(
        {
          email: 'missing@example.com',
          password: 'strong-password'
        },
        '192.0.2.1'
      )
    ).rejects.toThrow('Invalid email or password');
    expect(consumeAuthAttemptMock).toHaveBeenCalledWith(
      'login',
      'network',
      '192.0.2.1'
    );
    expect(consumeAuthAttemptMock).toHaveBeenCalledWith(
      'login',
      'account',
      'missing@example.com'
    );
    expect(clearAuthAccountAttemptsMock).not.toHaveBeenCalled();
  });

  it('atomically rotates a valid refresh session', async () => {
    rotateRefreshSessionMock.mockResolvedValue({
      id: 'user-primary',
      email: 'tanya@example.com',
      authVersion: 2
    });

    const { refreshAuthSession } = await import(
      '../../apps/api/src/features/auth/auth.service.js'
    );
    const result = await refreshAuthSession({
      refreshToken: 'current-refresh-token'
    });

    expect(result.user).toEqual({
      id: 'user-primary',
      email: 'tanya@example.com'
    });
    expect(rotateRefreshSessionMock).toHaveBeenCalledWith(
      expect.stringMatching(/\S+/),
      expect.objectContaining({
        id: expect.stringMatching(/\S+/),
        tokenHash: expect.stringMatching(/\S+/)
      }),
      expect.any(Date)
    );
    expect(createRefreshSessionMock).not.toHaveBeenCalled();
  });

  it('rejects missing refresh sessions', async () => {
    rotateRefreshSessionMock.mockResolvedValue(null);

    const { refreshAuthSession } = await import(
      '../../apps/api/src/features/auth/auth.service.js'
    );

    await expect(
      refreshAuthSession({ refreshToken: 'missing-refresh-token' })
    ).rejects.toThrow('Invalid or expired refresh session');
  });

  it('revokes a refresh session on logout', async () => {
    const { logoutUser } = await import(
      '../../apps/api/src/features/auth/auth.service.js'
    );
    await logoutUser({ refreshToken: 'current-refresh-token' });

    expect(revokeRefreshSessionFamilyByTokenHashMock).toHaveBeenCalledWith(
      expect.stringMatching(/\S+/),
      expect.any(Date)
    );
  });
});
