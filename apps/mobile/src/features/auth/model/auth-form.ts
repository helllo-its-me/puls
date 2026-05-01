import type { LoginRequest, RegisterRequest } from '@health/shared';
import { loginRequestSchema, registerRequestSchema } from '@health/shared';

import type { TranslationKey } from '@/i18n/dictionaries';
import { ApiError } from '@/lib/api/api-error';

export const authModes = {
  login: 'login',
  register: 'register'
} as const;

export type AuthMode = typeof authModes[keyof typeof authModes];

export type AuthFormValues = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

type LoginSubmitResult = {
  ok: true;
  mode: typeof authModes.login;
  payload: LoginRequest;
};

type RegisterSubmitResult = {
  ok: true;
  mode: typeof authModes.register;
  payload: RegisterRequest;
};

type AuthSubmitErrorResult = {
  ok: false;
  errorKey: TranslationKey;
};

export type AuthSubmitResult = LoginSubmitResult | RegisterSubmitResult | AuthSubmitErrorResult;

function getLoginRequiredValidationError(values: AuthFormValues): TranslationKey | null {
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

function getRegistrationRequiredValidationError(values: AuthFormValues): TranslationKey | null {
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

function getSchemaValidationError(issuePaths: PropertyKey[]): TranslationKey {
  if (issuePaths.includes('email')) {
    return 'auth.error.invalidEmail';
  }

  if (issuePaths.includes('password')) {
    return 'auth.error.passwordTooShort';
  }

  return 'auth.error.generic';
}

export function buildAuthSubmitResult(
  mode: AuthMode,
  values: AuthFormValues
): AuthSubmitResult {
  if (mode === authModes.register) {
    const requiredValidationError = getRegistrationRequiredValidationError(values);

    if (requiredValidationError) {
      return {
        ok: false,
        errorKey: requiredValidationError
      };
    }

    const parsedPayload = registerRequestSchema.safeParse({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password
    });

    if (!parsedPayload.success) {
      return {
        ok: false,
        errorKey: getSchemaValidationError(parsedPayload.error.issues.flatMap((issue) => issue.path))
      };
    }

    return {
      ok: true,
      mode,
      payload: parsedPayload.data
    };
  }

  const requiredValidationError = getLoginRequiredValidationError(values);

  if (requiredValidationError) {
    return {
      ok: false,
      errorKey: requiredValidationError
    };
  }

  const parsedPayload = loginRequestSchema.safeParse({
    email: values.email,
    password: values.password
  });

  if (!parsedPayload.success) {
    return {
      ok: false,
      errorKey: getSchemaValidationError(parsedPayload.error.issues.flatMap((issue) => issue.path))
    };
  }

  return {
    ok: true,
    mode,
    payload: parsedPayload.data
  };
}

export function getAuthSubmitErrorKey(error: unknown): TranslationKey {
  if (error instanceof ApiError) {
    if (error.message === 'Invalid email or password') {
      return 'auth.error.invalidCredentials';
    }

    if (error.message === 'Email is already registered') {
      return 'auth.error.emailRegistered';
    }

    return 'auth.error.generic';
  }

  if (error instanceof TypeError) {
    return 'auth.error.network';
  }

  return 'auth.error.generic';
}
