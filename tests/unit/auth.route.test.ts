import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AuthRateLimitExceededError,
  InvalidEmailVerificationCodeError,
  InvalidPasswordResetCodeError,
  InvalidPasswordResetSessionError,
  InvalidRefreshSessionError
} from '../../apps/api/src/features/auth/auth.errors.js';

const loginUserMock = vi.fn();
const completePasswordResetMock = vi.fn();
const requestPasswordResetMock = vi.fn();
const verifyPasswordResetCodeMock = vi.fn();
const registerUserMock = vi.fn();
const verifyRegisteredEmailMock = vi.fn();
const refreshAuthSessionMock = vi.fn();
const logoutUserMock = vi.fn();
const getAuthenticatedUserMock = vi.fn();
const consumeAuthAttemptMock = vi.fn();

vi.mock('../../apps/api/src/features/auth/auth.service.js', () => ({
  loginUser: loginUserMock,
  logoutUser: logoutUserMock,
  refreshAuthSession: refreshAuthSessionMock
}));

vi.mock('../../apps/api/src/features/auth/registration.service.js', () => ({
  registerUser: registerUserMock,
  verifyRegisteredEmail: verifyRegisteredEmailMock
}));

vi.mock('../../apps/api/src/features/auth/password-reset.service.js', () => ({
  completePasswordReset: completePasswordResetMock,
  requestPasswordReset: requestPasswordResetMock,
  verifyPasswordResetCode: verifyPasswordResetCodeMock
}));

vi.mock('../../apps/api/src/features/auth/authentication.service.js', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock
}));

vi.mock('../../apps/api/src/features/auth/auth.rate-limit.js', () => ({
  consumeAuthAttempt: consumeAuthAttemptMock
}));

describe('auth route', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.AUTH_TOKEN_SECRET = 'unit-test-auth-secret-value-32-chars';
    completePasswordResetMock.mockReset();
    loginUserMock.mockReset();
    logoutUserMock.mockReset();
    requestPasswordResetMock.mockReset();
    refreshAuthSessionMock.mockReset();
    registerUserMock.mockReset();
    verifyRegisteredEmailMock.mockReset();
    verifyPasswordResetCodeMock.mockReset();
    getAuthenticatedUserMock.mockReset();
    consumeAuthAttemptMock.mockReset();
    consumeAuthAttemptMock.mockResolvedValue(undefined);
    registerUserMock.mockResolvedValue({
      status: 'ok',
      registrationToken: 'registration-token'
    });
    requestPasswordResetMock.mockResolvedValue({
      status: 'ok',
      expiresAt: '2026-08-01T10:10:00.000Z'
    });
    getAuthenticatedUserMock.mockResolvedValue({
      id: 'user-primary',
      email: 'tanya@example.com'
    });
  });

  afterEach(() => {
    delete process.env.AUTH_TOKEN_SECRET;
    delete process.env.WEB_APP_ORIGINS;
  });

  it('returns a generic accepted response after registration', async () => {
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/register', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'strong-password-value',
        firstName: 'New',
        lastName: 'Member'
      })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(202);
    expect(data).toEqual({
      status: 'ok',
      registrationToken: 'registration-token'
    });
    expect(registerUserMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@example.com' }),
      'unavailable',
      1_000
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('verifies the email before the account can be used', async () => {
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/register/verify', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({
        email: 'new@example.com',
        code: '123456',
        registrationToken: 'registration-token'
      })
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
    expect(verifyRegisteredEmailMock).toHaveBeenCalledWith(
      {
        email: 'new@example.com',
        code: '123456',
        registrationToken: 'registration-token'
      },
      'unavailable'
    );
  });

  it('returns a typed error for an invalid email verification code', async () => {
    verifyRegisteredEmailMock.mockRejectedValue(
      new InvalidEmailVerificationCodeError()
    );
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/register/verify', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({
        email: 'new@example.com',
        code: '000000',
        registrationToken: 'registration-token'
      })
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: 'invalid_email_verification_code',
      message: 'Invalid or expired email verification code'
    });
  });

  it('logs in a user and returns an access token', async () => {
    loginUserMock.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
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
      refreshToken: 'refresh-token',
      user: {
        id: 'user-primary',
        email: 'tanya@example.com'
      }
    });
  });

  it('keeps the web refresh token in an HttpOnly cookie instead of the response body', async () => {
    process.env.WEB_APP_ORIGINS = 'https://app.example.com';
    loginUserMock.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-primary',
        email: 'tanya@example.com'
      }
    });

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: new Headers([
        ['content-type', 'application/json'],
        ['origin', 'https://app.example.com']
      ]),
      body: JSON.stringify({
        email: 'tanya@example.com',
        password: 'strong-password'
      })
    });
    const data: unknown = await response.json();
    const setCookieHeader = response.headers.get('set-cookie');

    expect(data).toEqual({
      accessToken: 'access-token',
      refreshToken: null,
      user: {
        id: 'user-primary',
        email: 'tanya@example.com'
      }
    });
    expect(setCookieHeader).toContain('puls_refresh=refresh-token');
    expect(setCookieHeader).toContain('HttpOnly');
    expect(setCookieHeader).toContain('SameSite=Strict');
    expect(setCookieHeader).toContain('Path=/api/v1/auth');
  });

  it('fails closed for untrusted staging origins and uses Secure cookies', async () => {
    process.env.NODE_ENV = 'staging';
    process.env.WEB_APP_ORIGINS = 'https://app.example.com';
    loginUserMock.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-primary',
        email: 'tanya@example.com'
      }
    });

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const attackerResponse = await app.request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: new Headers([
        ['content-type', 'application/json'],
        ['origin', 'https://attacker.example.com']
      ]),
      body: JSON.stringify({
        email: 'tanya@example.com',
        password: 'strong-password'
      })
    });
    const trustedResponse = await app.request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: new Headers([
        ['content-type', 'application/json'],
        ['origin', 'https://app.example.com']
      ]),
      body: JSON.stringify({
        email: 'tanya@example.com',
        password: 'strong-password'
      })
    });

    expect(attackerResponse.status).toBe(403);
    expect(attackerResponse.headers.get('access-control-allow-origin')).toBeNull();
    expect(await attackerResponse.json()).toEqual({
      code: 'web_origin_forbidden',
      message: 'Web auth origin is not allowed'
    });
    expect(trustedResponse.status).toBe(200);
    expect(trustedResponse.headers.get('access-control-allow-origin')).toBe(
      'https://app.example.com'
    );
    expect(trustedResponse.headers.get('set-cookie')).toContain('Secure');
  });

  it('rotates a web refresh cookie without accepting a body token', async () => {
    process.env.WEB_APP_ORIGINS = 'https://app.example.com';
    refreshAuthSessionMock.mockResolvedValue({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
      user: {
        id: 'user-primary',
        email: 'tanya@example.com'
      }
    });

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/refresh', {
      method: 'POST',
      headers: new Headers([
        ['content-type', 'application/json'],
        ['cookie', 'puls_refresh=current-refresh-token'],
        ['origin', 'https://app.example.com']
      ]),
      body: JSON.stringify({ refreshToken: null })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      accessToken: 'next-access-token',
      refreshToken: null,
      user: {
        id: 'user-primary',
        email: 'tanya@example.com'
      }
    });
    expect(refreshAuthSessionMock).toHaveBeenCalledWith({
      refreshToken: 'current-refresh-token'
    });
    expect(response.headers.get('set-cookie')).toContain(
      'puls_refresh=next-refresh-token'
    );
  });

  it('does not let a web caller downgrade to a body refresh token', async () => {
    process.env.WEB_APP_ORIGINS = 'https://app.example.com';
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/refresh', {
      method: 'POST',
      headers: new Headers([
        ['content-type', 'application/json'],
        ['origin', 'https://app.example.com']
      ]),
      body: JSON.stringify({ refreshToken: 'body-refresh-token' })
    });

    expect(response.status).toBe(401);
    expect(refreshAuthSessionMock).not.toHaveBeenCalled();
  });

  it('rejects refresh-cookie requests from an untrusted web origin', async () => {
    process.env.WEB_APP_ORIGINS = 'https://app.example.com';
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/refresh', {
      method: 'POST',
      headers: new Headers([
        ['content-type', 'application/json'],
        ['cookie', 'puls_refresh=current-refresh-token'],
        ['origin', 'https://attacker.example.com']
      ]),
      body: JSON.stringify({ refreshToken: null })
    });

    expect(response.status).toBe(403);
    expect(refreshAuthSessionMock).not.toHaveBeenCalled();
  });

  it('returns the current user for a valid bearer token', async () => {
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/me', {
      headers: new Headers([['authorization', 'Bearer access-token']])
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
    getAuthenticatedUserMock.mockResolvedValue(null);
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/me');
    const data: unknown = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      code: 'authentication_required',
      message: 'Current user is required'
    });
  });

  it('refreshes a valid refresh session and returns rotated tokens', async () => {
    refreshAuthSessionMock.mockResolvedValue({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
      user: {
        id: 'user-primary',
        email: 'tanya@example.com'
      }
    });

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/refresh', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({
        refreshToken: 'current-refresh-token'
      })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
      user: {
        id: 'user-primary',
        email: 'tanya@example.com'
      }
    });
    expect(refreshAuthSessionMock).toHaveBeenCalledWith({
      refreshToken: 'current-refresh-token'
    });
  });

  it('rejects invalid refresh sessions with a readable error', async () => {
    refreshAuthSessionMock.mockRejectedValue(new InvalidRefreshSessionError());

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/refresh', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({
        refreshToken: 'expired-refresh-token'
      })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({
      code: 'invalid_refresh_session',
      message: 'Invalid or expired refresh session'
    });
  });

  it('logs out by revoking the refresh session', async () => {
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/logout', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({
        refreshToken: 'current-refresh-token'
      })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: 'ok'
    });
    expect(logoutUserMock).toHaveBeenCalledWith({
      refreshToken: 'current-refresh-token'
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
      status: 'ok',
      expiresAt: '2026-08-01T10:10:00.000Z'
    });
    expect(requestPasswordResetMock).toHaveBeenCalledWith(
      { email: 'user@example.com' },
      'unavailable',
      1000
    );
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
    expect(verifyPasswordResetCodeMock).toHaveBeenCalledWith(
      {
        email: 'user@example.com',
        code: '123456'
      },
      'unavailable'
    );
  });

  it('returns a readable error for invalid password reset codes', async () => {
    verifyPasswordResetCodeMock.mockRejectedValue(new InvalidPasswordResetCodeError());

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
      code: 'invalid_reset_code',
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
        password: 'new-password-value',
        passwordConfirmation: 'new-password-value'
      })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      status: 'ok'
    });
    expect(completePasswordResetMock).toHaveBeenCalledWith({
      resetToken: 'verified-reset-token',
      password: 'new-password-value',
      passwordConfirmation: 'new-password-value'
    });
  });

  it('returns a readable error for invalid password reset sessions', async () => {
    completePasswordResetMock.mockRejectedValue(
      new InvalidPasswordResetSessionError()
    );

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/password-reset/complete', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({
        resetToken: 'expired-reset-token',
        password: 'new-password-value',
        passwordConfirmation: 'new-password-value'
      })
    });
    const data: unknown = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      code: 'invalid_reset_session',
      message: 'Invalid or expired password reset session'
    });
  });

  it('returns retry guidance when password reset requests are rate limited', async () => {
    requestPasswordResetMock.mockRejectedValue(new AuthRateLimitExceededError(42));

    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/password-reset/request', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({ email: 'user@example.com' })
    });

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('42');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('rejects oversized auth request bodies before parsing them', async () => {
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'x'.repeat(17 * 1024)
      })
    });

    expect(response.status).toBe(413);
    expect(loginUserMock).not.toHaveBeenCalled();
  });

  it.each([
    '/api/v1/auth/register',
    '/api/v1/auth/register/verify',
    '/api/v1/auth/login',
    '/api/v1/auth/refresh',
    '/api/v1/auth/logout',
    '/api/v1/auth/password-reset/request',
    '/api/v1/auth/password-reset/verify',
    '/api/v1/auth/password-reset/complete'
  ])('returns a typed 400 response for malformed JSON at %s', async (path) => {
    const { createApp } = await import('../../apps/api/src/app/create-app.js');
    const app = createApp();
    const response = await app.request(`http://localhost${path}`, {
      method: 'POST',
      headers: new Headers([['content-type', 'application/json']]),
      body: '{'
    });

    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({
      code: 'invalid_request',
      message: 'Invalid auth request payload'
    });
  });
});
