import { beforeEach, describe, expect, it, vi } from 'vitest';

import { currentUserIdHeaderName } from '@health/shared';

import { profileResponseFixture } from '../fixtures/profile.js';

const getProfileByUserIdMock = vi.fn();

vi.mock('../../apps/api/src/features/profile/profile.service.js', () => ({
  getProfileByUserId: getProfileByUserIdMock
}));

describe('profile route', () => {
  beforeEach(() => {
    getProfileByUserIdMock.mockReset();
  });

  it('returns the profile payload from the API', async () => {
    getProfileByUserIdMock.mockResolvedValue(profileResponseFixture);

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/profile', {
      headers: new Headers([[currentUserIdHeaderName, 'user-primary']])
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

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/profile', {
      headers: new Headers([[currentUserIdHeaderName, 'user-primary']])
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
