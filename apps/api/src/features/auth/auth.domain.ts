export type AuthUser = {
  id: string;
  email: string;
};

export type UserCredentials = AuthUser & {
  passwordHash: string | null;
};

export type CreateUserWithProfileInput = {
  userId: string;
  profileId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
};

export type CreateRefreshSessionInput = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
};

export type ActiveRefreshSession = {
  id: string;
  userId: string;
  email: string;
  expiresAt: Date;
};
