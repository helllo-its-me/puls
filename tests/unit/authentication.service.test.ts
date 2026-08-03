import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUserByIdAndAuthVersionMock = vi.fn();

vi.mock('../../apps/api/src/features/auth/auth.repository.js', () => ({
  getUserByIdAndAuthVersion: getUserByIdAndAuthVersionMock
}));

describe('authentication service', () => {
  beforeEach(() => {
    process.env.AUTH_TOKEN_SECRET = 'unit-test-auth-token-secret-value-01';
    getUserByIdAndAuthVersionMock.mockReset();
  });

  it('accepts an access token only while its auth version is current', async () => {
    getUserByIdAndAuthVersionMock.mockResolvedValue({
      id: 'user-primary',
      email: 'tanya@example.com'
    });
    const { createAccessToken } = await import(
      '../../apps/api/src/features/auth/auth.token.js'
    );
    const { getAuthenticatedUser } = await import(
      '../../apps/api/src/features/auth/authentication.service.js'
    );
    const token = createAccessToken({ id: 'user-primary', authVersion: 4 });

    await expect(getAuthenticatedUser(`Bearer ${token}`)).resolves.toEqual({
      id: 'user-primary',
      email: 'tanya@example.com'
    });
    expect(getUserByIdAndAuthVersionMock).toHaveBeenCalledWith('user-primary', 4);
  });

  it('rejects a correctly signed token after its auth version is revoked', async () => {
    getUserByIdAndAuthVersionMock.mockResolvedValue(null);
    const { createAccessToken } = await import(
      '../../apps/api/src/features/auth/auth.token.js'
    );
    const { getAuthenticatedUser } = await import(
      '../../apps/api/src/features/auth/authentication.service.js'
    );
    const token = createAccessToken({ id: 'user-primary', authVersion: 3 });

    await expect(getAuthenticatedUser(`Bearer ${token}`)).resolves.toBeNull();
  });
});
