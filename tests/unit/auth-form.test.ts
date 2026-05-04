import { describe, expect, it } from 'vitest';

import { ApiError } from '../../apps/mobile/src/lib/api/api-error.js';
import {
  authModes,
  buildAuthSubmitResult,
  getAuthSubmitErrorKey,
  type AuthFormValues
} from '../../apps/mobile/src/features/auth/model/auth-form.js';

function createAuthFormValues(input: Partial<AuthFormValues>): AuthFormValues {
  return {
    email: '',
    password: '',
    passwordConfirmation: '',
    resetCode: '',
    passwordResetToken: '',
    firstName: '',
    lastName: '',
    ...input
  };
}

describe('auth form model', () => {
  it('requires email and password for login', () => {
    const result = buildAuthSubmitResult(authModes.login, createAuthFormValues({}));

    expect(result).toEqual({
      ok: false,
      errorKey: 'auth.error.emailAndPasswordRequired'
    });
  });

  it('builds a typed login payload', () => {
    const result = buildAuthSubmitResult(authModes.login, createAuthFormValues({
      email: ' USER@example.com ',
      password: 'strong-password'
    }));

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
    const result = buildAuthSubmitResult(authModes.register, createAuthFormValues({
      email: 'new@example.com',
      password: 'strong-password',
      lastName: 'Member'
    }));

    expect(result).toEqual({
      ok: false,
      errorKey: 'auth.error.registrationRequired'
    });
  });

  it('returns readable validation errors for invalid registration input', () => {
    expect(
      buildAuthSubmitResult(authModes.register, createAuthFormValues({
        email: 'invalid-email',
        password: 'strong-password',
        firstName: 'New',
        lastName: 'Member'
      }))
    ).toEqual({
      ok: false,
      errorKey: 'auth.error.invalidEmail'
    });

    expect(
      buildAuthSubmitResult(authModes.register, createAuthFormValues({
        email: 'new@example.com',
        password: 'short',
        firstName: 'New',
        lastName: 'Member'
      }))
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

  it('builds a password reset request payload', () => {
    const result = buildAuthSubmitResult(
      authModes.requestPasswordReset,
      createAuthFormValues({
        email: ' USER@example.com '
      })
    );

    expect(result).toEqual({
      ok: true,
      mode: authModes.requestPasswordReset,
      payload: {
        email: 'user@example.com'
      }
    });
  });

  it('validates reset codes before verification', () => {
    const result = buildAuthSubmitResult(authModes.verifyPasswordResetCode, createAuthFormValues({
      email: 'user@example.com',
      resetCode: 'abc'
    }));

    expect(result).toEqual({
      ok: false,
      errorKey: 'auth.error.invalidResetCode'
    });
  });

  it('validates password confirmation before completing password reset', () => {
    const result = buildAuthSubmitResult(authModes.resetPassword, createAuthFormValues({
      passwordResetToken: 'reset-token',
      password: 'new-password',
      passwordConfirmation: 'other-password'
    }));

    expect(result).toEqual({
      ok: false,
      errorKey: 'auth.error.passwordConfirmationMismatch'
    });
  });

  it('requires verified email before completing password reset', () => {
    const result = buildAuthSubmitResult(authModes.resetPassword, createAuthFormValues({
      password: 'new-password',
      passwordConfirmation: 'new-password'
    }));

    expect(result).toEqual({
      ok: false,
      errorKey: 'auth.error.passwordResetVerificationRequired'
    });
  });

  it('builds a password reset completion payload with a verified reset token', () => {
    const result = buildAuthSubmitResult(authModes.resetPassword, createAuthFormValues({
      passwordResetToken: 'reset-token',
      password: 'new-password',
      passwordConfirmation: 'new-password'
    }));

    expect(result).toEqual({
      ok: true,
      mode: authModes.resetPassword,
      payload: {
        resetToken: 'reset-token',
        password: 'new-password',
        passwordConfirmation: 'new-password'
      }
    });
  });
});
