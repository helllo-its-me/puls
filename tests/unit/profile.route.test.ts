import { beforeEach, describe, expect, it, vi } from 'vitest';

import { profileResponseFixture } from '../fixtures/profile.js';

const getProfileByUserIdMock = vi.fn();

vi.mock('../../apps/api/src/features/profile/profile.service.js', () => ({
  getProfileByUserId: getProfileByUserIdMock
}));

describe('profile route', () => {
  beforeEach(() => {
    process.env.AUTH_TOKEN_SECRET = 'unit-test-auth-secret';
    getProfileByUserIdMock.mockReset();
  });

  it('returns the profile payload from the API', async () => {
    getProfileByUserIdMock.mockResolvedValue(profileResponseFixture);

    const { createAccessToken } = await import('../../apps/api/src/features/auth/auth.token.js');
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/profile', {
      headers: new Headers([['authorization', `Bearer ${createAccessToken({
        id: 'user-primary',
        email: 'tanya@example.com'
      })}`]])
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      id: 'profile-primary',
      firstName: 'Tanya',
      completionPercent: 84
    });
    expect(getProfileByUserIdMock).toHaveBeenCalledWith('user-primary');
  });

  it('returns 404 when profile is missing', async () => {
    getProfileByUserIdMock.mockResolvedValue(null);

    const { createAccessToken } = await import('../../apps/api/src/features/auth/auth.token.js');
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/profile', {
      headers: new Headers([['authorization', `Bearer ${createAccessToken({
        id: 'user-primary',
        email: 'tanya@example.com'
      })}`]])
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      message: 'Profile not found'
    });
  });

  it('returns 401 when current user is missing', async () => {
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/profile');
    const data: unknown = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      message: 'Current user is required'
    });
  });
});
