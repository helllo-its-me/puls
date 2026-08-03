import type {
  LoginRequest,
  PasswordResetCompleteRequest,
  PasswordResetRequest,
  PasswordResetVerifyRequest,
  RegisterRequest,
  RegisterVerifyRequest
} from '@health/shared';

import type { TranslationKey } from '@/i18n/dictionaries';

import { authModes } from './auth-modes';

export type AuthFormValues = {
  email: string;
  password: string;
  passwordConfirmation: string;
  resetCode: string;
  emailVerificationCode: string;
  registrationToken: string;
  passwordResetToken: string;
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

type RegisterVerifySubmitResult = {
  ok: true;
  mode: typeof authModes.verifyRegistration;
  payload: RegisterVerifyRequest;
};

type PasswordResetRequestSubmitResult = {
  ok: true;
  mode: typeof authModes.requestPasswordReset;
  payload: PasswordResetRequest;
};

type PasswordResetVerifySubmitResult = {
  ok: true;
  mode: typeof authModes.verifyPasswordResetCode;
  payload: PasswordResetVerifyRequest;
};

type PasswordResetCompleteSubmitResult = {
  ok: true;
  mode: typeof authModes.resetPassword;
  payload: PasswordResetCompleteRequest;
};

type AuthSubmitErrorResult = {
  ok: false;
  errorKey: TranslationKey;
};

export type AuthSubmitResult =
  | LoginSubmitResult
  | RegisterSubmitResult
  | RegisterVerifySubmitResult
  | PasswordResetRequestSubmitResult
  | PasswordResetVerifySubmitResult
  | PasswordResetCompleteSubmitResult
  | AuthSubmitErrorResult;
