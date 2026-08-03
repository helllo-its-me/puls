import type { TranslationKey } from '@/i18n/dictionaries';
import { ApiError } from '@/lib/api/api-error';
import { authErrorCodes } from '@health/shared';

export function getAuthSubmitErrorKey(error: unknown): TranslationKey {
  if (error instanceof ApiError) {
    if (error.code === authErrorCodes.rate_limited) {
      return 'auth.error.rateLimited';
    }

    if (error.code === authErrorCodes.invalid_credentials) {
      return 'auth.error.invalidCredentials';
    }

    if (error.code === authErrorCodes.invalid_email_verification_code) {
      return 'auth.error.invalidOrExpiredEmailVerificationCode';
    }

    if (error.code === authErrorCodes.invalid_reset_code) {
      return 'auth.error.invalidOrExpiredResetCode';
    }

    if (error.code === authErrorCodes.invalid_reset_session) {
      return 'auth.error.invalidOrExpiredPasswordResetSession';
    }

    return 'auth.error.generic';
  }

  if (error instanceof TypeError) {
    return 'auth.error.network';
  }

  return 'auth.error.generic';
}
