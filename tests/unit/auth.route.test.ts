import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loginUserMock = vi.fn();
const completePasswordResetMock = vi.fn();
const requestPasswordResetMock = vi.fn();
const verifyPasswordResetCodeMock = vi.fn();
const registerUserMock = vi.fn();

vi.mock('../../apps/api/src/features/auth/auth.service.js', () => ({
  loginUser: loginUserMock,
  registerUser: registerUserMock
}));

vi.mock('../../apps/api/src/features/auth/password-reset.service.js', () => ({
  completePasswordReset: completePasswordResetMock,
  requestPasswordReset: requestPasswordResetMock,
  verifyPasswordResetCode: verifyPasswordResetCodeMock
}));

describe('auth route', () => {
  beforeEach(() => {
    process.env.AUTH_TOKEN_SECRET = 'unit-test-auth-secret';
    completePasswordResetMock.mockReset();
    loginUserMock.mockReset();
    requestPasswordResetMock.mockReset();
    registerUserMock.mockReset();
    verifyPasswordResetCodeMock.mockReset();
  });

  afterEach(() => {
    delete process.env.AUTH_TOKEN_SECRET;
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

  it('returns the current user for a valid bearer token', async () => {
    const { createAccessToken } = await import('../../apps/api/src/features/auth/auth.token.js');
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const token = createAccessToken({
      id: 'user-primary',
      email: 'tanya@example.com'
    });
    const response = await app.request('http://localhost/api/v1/auth/me', {
      headers: new Headers([['authorization', `Bearer ${token}`]])
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      user: {
        id: 'user-primary',
        email: 'tanya@example.com'
      }
    });
  });

  it('rejects current user requests without a valid bearer token', async () => {
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/me');
    const data: unknown = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      message: 'Current user is required'
    });
  });

  it('requests a password reset code without revealing whether the user exists', async () => {
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/password-reset/request', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({
        email: 'user@example.com'
      })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: 'ok'
    });
    expect(requestPasswordResetMock).toHaveBeenCalledWith({
      email: 'user@example.com'
    });
  });

  it('verifies a password reset code', async () => {
    verifyPasswordResetCodeMock.mockResolvedValue({
      resetToken: 'verified-reset-token'
    });

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/password-reset/verify', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({
        email: 'user@example.com',
        code: '123456'
      })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      resetToken: 'verified-reset-token'
    });
    expect(verifyPasswordResetCodeMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      code: '123456'
    });
  });

  it('returns a readable error for invalid password reset codes', async () => {
    verifyPasswordResetCodeMock.mockRejectedValue(new Error('Invalid or expired reset code'));

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/password-reset/verify', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({
        email: 'user@example.com',
        code: '123456'
      })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      message: 'Invalid or expired reset code'
    });
  });

  it('completes a password reset', async () => {
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/password-reset/complete', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({
        resetToken: 'verified-reset-token',
        password: 'new-password',
        passwordConfirmation: 'new-password'
      })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: 'ok'
    });
    expect(completePasswordResetMock).toHaveBeenCalledWith({
      resetToken: 'verified-reset-token',
      password: 'new-password',
      passwordConfirmation: 'new-password'
    });
  });

  it('returns a readable error for invalid password reset sessions', async () => {
    completePasswordResetMock.mockRejectedValue(
      new Error('Invalid or expired password reset session')
    );

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/password-reset/complete', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({
        resetToken: 'expired-reset-token',
        password: 'new-password',
        passwordConfirmation: 'new-password'
      })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      message: 'Invalid or expired password reset session'
    });
  });
});
