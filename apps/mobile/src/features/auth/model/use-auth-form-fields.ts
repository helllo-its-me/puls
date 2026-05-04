import { useState } from 'react';

import type { AuthFormValues } from './auth-form';

export type AuthFormFieldSetters = {
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setPasswordConfirmation: (value: string) => void;
  setResetCode: (value: string) => void;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
};

type UseAuthFormFieldsResult = {
  values: AuthFormValues;
  setters: AuthFormFieldSetters;
  setPasswordResetToken: (value: string) => void;
  clearPasswordResetFields: () => void;
  clearPasswordResetToken: () => void;
};

export function useAuthFormFields(): UseAuthFormFieldsResult {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [passwordResetToken, setPasswordResetToken] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  function clearPasswordResetFields() {
    setPassword('');
    setPasswordConfirmation('');
    setResetCode('');
    setPasswordResetToken('');
  }

  return {
    values: {
      email,
      password,
      passwordConfirmation,
      resetCode,
      passwordResetToken,
      firstName,
      lastName
    },
    setters: {
      setEmail,
      setPassword,
      setPasswordConfirmation,
      setResetCode,
      setFirstName,
      setLastName
    },
    setPasswordResetToken,
    clearPasswordResetFields,
    clearPasswordResetToken: () => {
      setPasswordResetToken('');
    }
  };
}
