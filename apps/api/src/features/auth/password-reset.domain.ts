export type PasswordResetCode = {
  id: string;
  email: string;
  codeHash: string;
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
  expiresAt: Date;
  createdAt: Date;
};
