import { beforeEach, describe, expect, it, vi } from 'vitest';

import { profileResponseFixture } from '../fixtures/profile.js';

const getProfileMock = vi.fn();

vi.mock('../../apps/api/src/features/profile/profile.service.js', () => ({
  getProfile: getProfileMock
}));

describe('profile route', () => {
  beforeEach(() => {
    getProfileMock.mockReset();
  });

  it('returns the profile payload from the API', async () => {
    getProfileMock.mockResolvedValue(profileResponseFixture);

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/profile');
    const data: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      id: 'profile-primary',
      firstName: 'Tanya',
      completionPercent: 84
    });
  });

  it('returns 404 when profile is missing', async () => {
    getProfileMock.mockResolvedValue(null);

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/profile');
    const data: unknown = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      message: 'Profile not found'
    });
  });
});
