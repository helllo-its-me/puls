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
