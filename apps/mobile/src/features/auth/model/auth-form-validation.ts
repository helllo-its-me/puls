import type { TranslationKey } from '@/i18n/dictionaries';

import type { AuthFormValues } from './auth-form.types';

export function getLoginRequiredValidationError(
  values: AuthFormValues
): TranslationKey | null {
  const hasEmail = values.email.trim().length > 0;
  const hasPassword = values.password.length > 0;

  if (!hasEmail && !hasPassword) {
    return 'auth.error.emailAndPasswordRequired';
  }

  if (!hasEmail) {
    return 'auth.error.emailRequired';
  }

  if (!hasPassword) {
    return 'auth.error.passwordRequired';
  }

  return null;
}

export function getRegistrationRequiredValidationError(
  values: AuthFormValues
): TranslationKey | null {
  if (
    !values.email.trim() ||
    !values.password ||
    !values.firstName.trim() ||
    !values.lastName.trim()
  ) {
    return 'auth.error.registrationRequired';
  }

  return null;
}

export function getPasswordResetRequestRequiredValidationError(
  values: AuthFormValues
): TranslationKey | null {
  return values.email.trim() ? null : 'auth.error.emailRequired';
}

export function getPasswordResetVerifyRequiredValidationError(
  values: AuthFormValues
): TranslationKey | null {
  return values.resetCode.trim() ? null : 'auth.error.resetCodeRequired';
}

export function getPasswordResetCompleteRequiredValidationError(
  values: AuthFormValues
): TranslationKey | null {
  if (!values.passwordResetToken) {
    return 'auth.error.passwordResetVerificationRequired';
  }

  if (!values.password || !values.passwordConfirmation) {
    return 'auth.error.passwordAndConfirmationRequired';
  }

  return null;
}

export function getSchemaValidationError(issuePaths: PropertyKey[]): TranslationKey {
  if (issuePaths.includes('email')) {
    return 'auth.error.invalidEmail';
  }

  if (issuePaths.includes('code')) {
    return 'auth.error.invalidResetCode';
  }

  if (issuePaths.includes('passwordConfirmation')) {
    return 'auth.error.passwordConfirmationMismatch';
  }

  if (issuePaths.includes('password')) {
    return 'auth.error.passwordTooShort';
  }

  return 'auth.error.generic';
}
