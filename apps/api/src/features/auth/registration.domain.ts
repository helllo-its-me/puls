export type CreateRegistrationAttemptInput = {
  id: string;
  registrationTokenHash: string;
  userId: string;
  profileId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  codeHash: string;
  encryptedCode: string;
  codeExpiresAt: Date;
  emailJobId: string;
  createdAt: Date;
};

export type RegistrationAttempt = {
  id: string;
  email: string;
  codeHash: string;
  expiresAt: Date;
};
