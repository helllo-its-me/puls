import { useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import {
  usePasswordResetCompleteMutation,
  usePasswordResetRequestMutation,
  usePasswordResetVerifyMutation
} from '@/features/auth/api/use-auth-mutations';
import {
  authModes,
  buildAuthSubmitResult,
  getAuthSubmitErrorKey,
  type AuthFormValues,
  type AuthMode
} from '@/features/auth/model/auth-form';
import {
  type AuthFormFieldSetters,
  useAuthFormFields
} from '@/features/auth/model/use-auth-form-fields';
import { usePasswordResetCountdown } from '@/features/auth/model/use-password-reset-countdown';
import type { TranslationKey } from '@/i18n/dictionaries';

type UseAuthFormResult = {
  mode: AuthMode;
  isRegisterMode: boolean;
  isPasswordResetRequestMode: boolean;
  isPasswordResetVerifyMode: boolean;
  isPasswordResetCompleteMode: boolean;
  values: AuthFormValues;
  setters: AuthFormFieldSetters;
  isPasswordVisible: boolean;
  isSubmitting: boolean;
  errorKey: TranslationKey | null;
  successKey: TranslationKey | null;
  passwordResetCountdownSeconds: number | null;
  canResendPasswordResetCode: boolean;
  goToPasswordResetRequest: () => void;
  goToLogin: () => void;
  resendPasswordResetCode: () => Promise<void>;
  switchMode: () => void;
  togglePasswordVisibility: () => void;
  submit: () => Promise<void>;
};

export function useAuthForm(): UseAuthFormResult {
  const auth = useAuth();
  const formFields = useAuthFormFields();
  const passwordResetCountdown = usePasswordResetCountdown();
  const passwordResetRequestMutation = usePasswordResetRequestMutation();
  const passwordResetVerifyMutation = usePasswordResetVerifyMutation();
  const passwordResetCompleteMutation = usePasswordResetCompleteMutation();
  const [mode, setMode] = useState<AuthMode>(authModes.login);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [successKey, setSuccessKey] = useState<TranslationKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const values = formFields.values;
  const isRegisterMode = mode === authModes.register;
  const isPasswordResetRequestMode = mode === authModes.requestPasswordReset;
  const isPasswordResetVerifyMode = mode === authModes.verifyPasswordResetCode;
  const isPasswordResetCompleteMode = mode === authModes.resetPassword;
  const isPasswordResetSubmitting = passwordResetRequestMutation.isPending
    || passwordResetVerifyMutation.isPending
    || passwordResetCompleteMutation.isPending;
  function setModeAndClearMessages(nextMode: AuthMode) {
    setErrorKey(null);
    setSuccessKey(null);
    setMode(nextMode);
  }

  async function resendPasswordResetCode() {
    setErrorKey(null);
    setSuccessKey(null);

    if (!values.email.trim()) {
      setErrorKey('auth.error.emailRequired');
      return;
    }

    const submitResult = buildAuthSubmitResult(authModes.requestPasswordReset, values);

    if (!submitResult.ok) {
      setErrorKey(submitResult.errorKey);
      return;
    }

    if (submitResult.mode !== authModes.requestPasswordReset) {
      setErrorKey('auth.error.generic');
      return;
    }

    setIsSubmitting(true);

    try {
      await passwordResetRequestMutation.mutateAsync(submitResult.payload);
      formFields.clearPasswordResetFields();
      passwordResetCountdown.startCountdown();
      setMode(authModes.verifyPasswordResetCode);
    } catch (error) {
      setErrorKey(getAuthSubmitErrorKey(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submit() {
    setErrorKey(null);
    setSuccessKey(null);
    const submitResult = buildAuthSubmitResult(mode, values);

    if (!submitResult.ok) {
      setErrorKey(submitResult.errorKey);
      return;
    }

    setIsSubmitting(true);

    try {
      if (submitResult.mode === authModes.register) {
        await auth.register(submitResult.payload);
        return;
      }

      if (submitResult.mode === authModes.requestPasswordReset) {
        await passwordResetRequestMutation.mutateAsync(submitResult.payload);
        formFields.clearPasswordResetToken();
        passwordResetCountdown.startCountdown();
        setMode(authModes.verifyPasswordResetCode);
        return;
      }

      if (submitResult.mode === authModes.verifyPasswordResetCode) {
        const verifyResult = await passwordResetVerifyMutation.mutateAsync(submitResult.payload);
        formFields.setPasswordResetToken(verifyResult.resetToken);
        passwordResetCountdown.stopCountdown();
        setMode(authModes.resetPassword);
        return;
      }

      if (submitResult.mode === authModes.resetPassword) {
        await passwordResetCompleteMutation.mutateAsync(submitResult.payload);
        formFields.clearPasswordResetFields();
        passwordResetCountdown.stopCountdown();
        setSuccessKey('auth.passwordReset.complete.success');
        setMode(authModes.login);
        return;
      }

      await auth.login(submitResult.payload);
    } catch (error) {
      setErrorKey(getAuthSubmitErrorKey(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    mode,
    isRegisterMode,
    isPasswordResetRequestMode,
    isPasswordResetVerifyMode,
    isPasswordResetCompleteMode,
    values,
    setters: formFields.setters,
    isPasswordVisible,
    isSubmitting: isSubmitting || isPasswordResetSubmitting,
    errorKey,
    successKey,
    passwordResetCountdownSeconds: passwordResetCountdown.countdownSeconds,
    canResendPasswordResetCode: passwordResetCountdown.canResendCode,
    goToPasswordResetRequest: () => {
      formFields.clearPasswordResetFields();
      passwordResetCountdown.stopCountdown();
      setModeAndClearMessages(authModes.requestPasswordReset);
    },
    goToLogin: () => {
      passwordResetCountdown.stopCountdown();
      formFields.clearPasswordResetToken();
      setModeAndClearMessages(authModes.login);
    },
    resendPasswordResetCode,
    switchMode: () => {
      setModeAndClearMessages(isRegisterMode ? authModes.login : authModes.register);
    },
    togglePasswordVisibility: () => {
      setIsPasswordVisible((currentValue) => !currentValue);
    },
    submit
  };
}
