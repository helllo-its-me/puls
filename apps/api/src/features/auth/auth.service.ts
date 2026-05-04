import { randomUUID } from 'node:crypto';

import type { AuthResponse, LoginRequest, RegisterRequest } from '@health/shared';

import { createAccessToken } from './auth.token.js';
import { hashPassword, verifyPassword } from './auth.password.js';
import {
  createUserWithProfile,
  getUserCredentialsByEmail
} from './auth.repository.js';

function toAuthResponse(user: { id: string; email: string }): AuthResponse {
  return {
    accessToken: createAccessToken(user),
    user
  };
}

export async function registerUser(input: RegisterRequest): Promise<AuthResponse> {
  const existingUser = await getUserCredentialsByEmail(input.email);

  if (existingUser) {
    throw new Error('Email is already registered');
  }

  const user = await createUserWithProfile({
    userId: randomUUID(),
    profileId: randomUUID(),
    email: input.email,
    passwordHash: await hashPassword(input.password),
    firstName: input.firstName,
    lastName: input.lastName,
    createdAt: new Date()
  });

  return toAuthResponse(user);
}

export async function loginUser(input: LoginRequest): Promise<AuthResponse> {
  const user = await getUserCredentialsByEmail(input.email);

  if (!user?.passwordHash) {
    throw new Error('Invalid email or password');
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new Error('Invalid email or password');
  }

  return toAuthResponse({
    id: user.id,
    email: user.email
  });
}
