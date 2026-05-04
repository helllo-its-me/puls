import {
  loginRequestSchema,
  passwordResetCompleteRequestSchema,
  passwordResetRequestSchema,
  passwordResetVerifyRequestSchema,
  registerRequestSchema
} from '@health/shared';

import { authModes, type AuthMode } from './auth-modes';
import type { AuthFormValues, AuthSubmitResult } from './auth-form.types';
import {
  getLoginRequiredValidationError,
  getPasswordResetCompleteRequiredValidationError,
  getPasswordResetRequestRequiredValidationError,
  getPasswordResetVerifyRequiredValidationError,
  getRegistrationRequiredValidationError,
  getSchemaValidationError
} from './auth-form-validation';

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

  if (mode === authModes.requestPasswordReset) {
    const requiredValidationError = getPasswordResetRequestRequiredValidationError(values);

    if (requiredValidationError) {
      return {
        ok: false,
        errorKey: requiredValidationError
      };
    }

    const parsedPayload = passwordResetRequestSchema.safeParse({
      email: values.email
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

  if (mode === authModes.verifyPasswordResetCode) {
    const requiredValidationError = getPasswordResetVerifyRequiredValidationError(values);

    if (requiredValidationError) {
      return {
        ok: false,
        errorKey: requiredValidationError
      };
    }

    const parsedPayload = passwordResetVerifyRequestSchema.safeParse({
      email: values.email,
      code: values.resetCode
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

  if (mode === authModes.resetPassword) {
    const requiredValidationError = getPasswordResetCompleteRequiredValidationError(values);

    if (requiredValidationError) {
      return {
        ok: false,
        errorKey: requiredValidationError
      };
    }

    const parsedPayload = passwordResetCompleteRequestSchema.safeParse({
      resetToken: values.passwordResetToken,
      password: values.password,
      passwordConfirmation: values.passwordConfirmation
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
