import { useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import {
  authModes,
  buildAuthSubmitResult,
  getAuthSubmitErrorKey,
  type AuthFormValues,
  type AuthMode
} from '@/features/auth/model/auth-form';
import type { TranslationKey } from '@/i18n/dictionaries';

type AuthFormFieldSetters = {
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
};

type UseAuthFormResult = {
  mode: AuthMode;
  isRegisterMode: boolean;
  values: AuthFormValues;
  setters: AuthFormFieldSetters;
  isPasswordVisible: boolean;
  isSubmitting: boolean;
  errorKey: TranslationKey | null;
  switchMode: () => void;
  togglePasswordVisibility: () => void;
  submit: () => Promise<void>;
};

export function useAuthForm(): UseAuthFormResult {
  const auth = useAuth();
  const [mode, setMode] = useState<AuthMode>(authModes.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const values: AuthFormValues = {
    email,
    password,
    firstName,
    lastName
  };
  const isRegisterMode = mode === authModes.register;

  async function submit() {
    setErrorKey(null);
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
    values,
    setters: {
      setEmail,
      setPassword,
      setFirstName,
      setLastName
    },
    isPasswordVisible,
    isSubmitting,
    errorKey,
    switchMode: () => {
      setErrorKey(null);
      setMode(isRegisterMode ? authModes.login : authModes.register);
    },
    togglePasswordVisibility: () => {
      setIsPasswordVisible((currentValue) => !currentValue);
    },
    submit
  };
}
