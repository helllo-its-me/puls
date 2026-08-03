export const passwordResetCodeEmailJobKind = 'reset-code';
export const passwordChangedEmailJobKind = 'password-changed';
export const emailVerificationCodeEmailJobKind = 'email-verification-code';

export type PasswordResetEmailJob = {
  id: string;
  kind:
    | typeof passwordResetCodeEmailJobKind
    | typeof passwordChangedEmailJobKind
    | typeof emailVerificationCodeEmailJobKind;
  email: string;
  encryptedCode: string | null;
  codeExpiresAt: Date | null;
  attempts: number;
};

export type CreatePasswordResetEmailJobInput = {
  id: string;
  kind: PasswordResetEmailJob['kind'];
  email: string;
  encryptedCode: string | null;
  codeExpiresAt: Date | null;
  availableAt: Date;
  createdAt: Date;
};
