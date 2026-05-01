import { beforeEach, describe, expect, it, vi } from 'vitest';

const loginUserMock = vi.fn();
const registerUserMock = vi.fn();

vi.mock('../../apps/api/src/features/auth/auth.service.js', () => ({
  loginUser: loginUserMock,
  registerUser: registerUserMock
}));

describe('auth route', () => {
  beforeEach(() => {
    loginUserMock.mockReset();
    registerUserMock.mockReset();
  });

  it('registers a user and returns an access token', async () => {
    registerUserMock.mockResolvedValue({
      accessToken: 'access-token',
      user: {
        id: 'user-created',
        email: 'new@example.com'
      }
    });

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/register', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'strong-password',
        firstName: 'New',
        lastName: 'Member'
      })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual({
      accessToken: 'access-token',
      user: {
        id: 'user-created',
        email: 'new@example.com'
      }
    });
  });

  it('logs in a user and returns an access token', async () => {
    loginUserMock.mockResolvedValue({
      accessToken: 'access-token',
      user: {
        id: 'user-primary',
        email: 'tanya@example.com'
      }
    });

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({
        email: 'tanya@example.com',
        password: 'strong-password'
      })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      accessToken: 'access-token',
      user: {
        id: 'user-primary',
        email: 'tanya@example.com'
      }
    });
  });
});
