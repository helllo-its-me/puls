export type AuthUser = {
  id: string;
  email: string;
};

export type AuthSessionUser = AuthUser & {
  authVersion: number;
};

export type UserCredentials = AuthSessionUser & {
  passwordHash: string | null;
};

export type CreateRefreshSessionInput = {
  id: string;
  familyId: string;
  userId: string;
  authVersion: number;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
};
