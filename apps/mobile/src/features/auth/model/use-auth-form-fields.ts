import { useState } from 'react';

import type { AuthFormValues } from './auth-form';

export type AuthFormFieldSetters = {
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setPasswordConfirmation: (value: string) => void;
  setResetCode: (value: string) => void;
  setEmailVerificationCode: (value: string) => void;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
};

type UseAuthFormFieldsResult = {
  values: AuthFormValues;
  setters: AuthFormFieldSetters;
  setRegistrationToken: (value: string) => void;
  setPasswordResetToken: (value: string) => void;
  clearPasswordResetFields: () => void;
  clearPasswordResetToken: () => void;
  clearEmailVerificationCode: () => void;
  clearRegistrationVerification: () => void;
};

export function useAuthFormFields(): UseAuthFormFieldsResult {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
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
      emailVerificationCode,
      registrationToken,
      passwordResetToken,
      firstName,
      lastName
    },
    setters: {
      setEmail,
      setPassword,
      setPasswordConfirmation,
      setResetCode,
      setEmailVerificationCode,
      setFirstName,
      setLastName
    },
    setPasswordResetToken,
    clearPasswordResetFields,
    clearPasswordResetToken: () => {
      setPasswordResetToken('');
    },
    clearEmailVerificationCode: () => {
      setEmailVerificationCode('');
    },
    clearRegistrationVerification: () => {
      setEmailVerificationCode('');
      setRegistrationToken('');
    },
    setRegistrationToken: (value: string) => {
      setRegistrationToken(value);
    }
  };
}
