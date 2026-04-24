import { describe, expect, it } from 'vitest';

import { createApp } from '../../apps/api/src/app/create-app.js';

describe('profile route', () => {
  it('returns the profile payload from the API', async () => {
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
});
