import type { TranslationKey } from '@/i18n/dictionaries';
import { ApiError } from '@/lib/api/api-error';

export function getAuthSubmitErrorKey(error: unknown): TranslationKey {
  if (error instanceof ApiError) {
    if (error.message === 'Invalid email or password') {
      return 'auth.error.invalidCredentials';
    }

    if (error.message === 'Email is already registered') {
      return 'auth.error.emailRegistered';
    }

    if (error.message === 'Invalid or expired reset code') {
      return 'auth.error.invalidOrExpiredResetCode';
    }

    if (error.message === 'Invalid or expired password reset session') {
      return 'auth.error.invalidOrExpiredPasswordResetSession';
    }

    return 'auth.error.generic';
  }

  if (error instanceof TypeError) {
    return 'auth.error.network';
  }

  return 'auth.error.generic';
}
