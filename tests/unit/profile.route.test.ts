import { beforeEach, describe, expect, it, vi } from 'vitest';

import { profileResponseFixture } from '../fixtures/profile.js';

const getProfileByUserIdMock = vi.fn();
const updateProfileByUserIdMock = vi.fn();

vi.mock('../../apps/api/src/features/profile/profile.service.js', () => ({
  getProfileByUserId: getProfileByUserIdMock,
  updateProfileByUserId: updateProfileByUserIdMock
}));

describe('profile route', () => {
  beforeEach(() => {
    process.env.AUTH_TOKEN_SECRET = 'unit-test-auth-secret';
    getProfileByUserIdMock.mockReset();
    updateProfileByUserIdMock.mockReset();
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

  it('updates the current user profile', async () => {
    updateProfileByUserIdMock.mockResolvedValue({
      ...profileResponseFixture,
      firstName: 'Tata',
      lastName: 'Vorobeva',
      fullName: 'Tata Vorobeva',
      birthDate: '1991-05-20',
      heightCm: 170,
      weightKg: 59,
      gender: 'female'
    });

    const { createAccessToken } = await import('../../apps/api/src/features/auth/auth.token.js');
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/profile', {
      method: 'PATCH',
      headers: new Headers([
        ['authorization', `Bearer ${createAccessToken({
          id: 'user-primary',
          email: 'tanya@example.com'
        })}`],
        ['content-type', 'application/json']
      ]),
      body: JSON.stringify({
        firstName: 'Tata',
        lastName: 'Vorobeva',
        birthDate: '1991-05-20',
        heightCm: 170,
        weightKg: 59,
        gender: 'female'
      })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      firstName: 'Tata',
      lastName: 'Vorobeva',
      fullName: 'Tata Vorobeva',
      birthDate: '1991-05-20',
      heightCm: 170,
      weightKg: 59,
      gender: 'female'
    });
    expect(updateProfileByUserIdMock).toHaveBeenCalledWith('user-primary', {
      firstName: 'Tata',
      lastName: 'Vorobeva',
      birthDate: '1991-05-20',
      heightCm: 170,
      weightKg: 59,
      gender: 'female'
    });
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

  it('returns a readable error for invalid profile update payload', async () => {
    const { createAccessToken } = await import('../../apps/api/src/features/auth/auth.token.js');
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/profile', {
      method: 'PATCH',
      headers: new Headers([
        ['authorization', `Bearer ${createAccessToken({
          id: 'user-primary',
          email: 'tanya@example.com'
        })}`],
        ['content-type', 'application/json']
      ]),
      body: JSON.stringify({
        firstName: '',
        lastName: 'Vorobeva',
        birthDate: '20.05.1991',
        heightCm: 170,
        weightKg: 59,
        gender: 'female'
      })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      message: 'Invalid profile update payload'
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
