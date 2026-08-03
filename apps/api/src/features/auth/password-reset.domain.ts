export type PasswordResetCode = {
  id: string;
  email: string;
  codeHash: string;
  encryptedCode: string | null;
  expiresAt: Date;
  resetTokenHash: string | null;
  resetTokenExpiresAt: Date | null;
  verifiedAt: Date | null;
  usedAt: Date | null;
  createdAt: Date;
};

export type CreatePasswordResetCodeInput = {
  id: string;
  email: string;
  codeHash: string;
  encryptedCode: string;
  expiresAt: Date;
  createdAt: Date;
};
