import { describe, expect, it } from 'vitest';

import { ApiError } from '../../apps/mobile/src/lib/api/api-error.js';
import {
  authModes,
  buildAuthSubmitResult,
  getAuthSubmitErrorKey
} from '../../apps/mobile/src/features/auth/model/auth-form.js';

describe('auth form model', () => {
  it('requires email and password for login', () => {
    const result = buildAuthSubmitResult(authModes.login, {
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    });

    expect(result).toEqual({
      ok: false,
      errorKey: 'auth.error.emailAndPasswordRequired'
    });
  });

  it('builds a typed login payload', () => {
    const result = buildAuthSubmitResult(authModes.login, {
      email: ' USER@example.com ',
      password: 'strong-password',
      firstName: '',
      lastName: ''
    });

    expect(result).toEqual({
      ok: true,
      mode: authModes.login,
      payload: {
        email: 'user@example.com',
        password: 'strong-password'
      }
    });
  });

  it('requires registration profile fields', () => {
    const result = buildAuthSubmitResult(authModes.register, {
      email: 'new@example.com',
      password: 'strong-password',
      firstName: '',
      lastName: 'Member'
    });

    expect(result).toEqual({
      ok: false,
      errorKey: 'auth.error.registrationRequired'
    });
  });

  it('returns readable validation errors for invalid registration input', () => {
    expect(
      buildAuthSubmitResult(authModes.register, {
        email: 'invalid-email',
        password: 'strong-password',
        firstName: 'New',
        lastName: 'Member'
      })
    ).toEqual({
      ok: false,
      errorKey: 'auth.error.invalidEmail'
    });

    expect(
      buildAuthSubmitResult(authModes.register, {
        email: 'new@example.com',
        password: 'short',
        firstName: 'New',
        lastName: 'Member'
      })
    ).toEqual({
      ok: false,
      errorKey: 'auth.error.passwordTooShort'
    });
  });

  it('maps submit failures to readable translation keys', () => {
    expect(getAuthSubmitErrorKey(new ApiError('Invalid email or password', 401))).toBe(
      'auth.error.invalidCredentials'
    );
    expect(getAuthSubmitErrorKey(new ApiError('Email is already registered', 409))).toBe(
      'auth.error.emailRegistered'
    );
    expect(getAuthSubmitErrorKey(new TypeError('Failed to fetch'))).toBe('auth.error.network');
    expect(getAuthSubmitErrorKey(new Error('Unexpected'))).toBe('auth.error.generic');
  });
});
