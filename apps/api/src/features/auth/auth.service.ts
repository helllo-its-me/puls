import { randomUUID } from 'node:crypto';

import {
  refreshSessionTtlSeconds,
  type AuthResponse,
  type LoginRequest,
  type RefreshTokenRequest,
  type RegisterRequest
} from '@health/shared';

import { createRefreshTokenValue, hashRefreshToken } from './auth.refresh-session.js';
import { createAccessToken } from './auth.token.js';
import { hashPassword, verifyPassword } from './auth.password.js';
import {
  createRefreshSession,
  createUserWithProfile,
  getActiveRefreshSessionByTokenHash,
  getUserCredentialsByEmail,
  revokeRefreshSession
} from './auth.repository.js';

const millisecondsPerSecond = 1000;
const refreshSessionTtlMs = refreshSessionTtlSeconds * millisecondsPerSecond;

async function toAuthResponse(
  user: { id: string; email: string },
  now: Date
): Promise<AuthResponse> {
  const refreshToken = createRefreshTokenValue();

  await createRefreshSession({
    id: randomUUID(),
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: new Date(now.getTime() + refreshSessionTtlMs),
    createdAt: now
  });

  return {
    accessToken: createAccessToken(user),
    refreshToken,
    user
  };
}

export async function registerUser(input: RegisterRequest): Promise<AuthResponse> {
  const existingUser = await getUserCredentialsByEmail(input.email);

  if (existingUser) {
    throw new Error('Email is already registered');
  }

  const now = new Date();
  const user = await createUserWithProfile({
    userId: randomUUID(),
    profileId: randomUUID(),
    email: input.email,
    passwordHash: await hashPassword(input.password),
    firstName: input.firstName,
    lastName: input.lastName,
    createdAt: now
  });

  return toAuthResponse(user, now);
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

  return toAuthResponse(
    {
      id: user.id,
      email: user.email
    },
    new Date()
  );
}

export async function refreshAuthSession(
  input: RefreshTokenRequest,
  now: Date = new Date()
): Promise<AuthResponse> {
  const refreshSession = await getActiveRefreshSessionByTokenHash(
    hashRefreshToken(input.refreshToken),
    now
  );

  if (!refreshSession) {
    throw new Error('Invalid or expired refresh session');
  }

  await revokeRefreshSession(refreshSession.id, now);

  return toAuthResponse(
    {
      id: refreshSession.userId,
      email: refreshSession.email
    },
    now
  );
}

export async function logoutUser(input: RefreshTokenRequest, now: Date = new Date()): Promise<void> {
  const refreshSession = await getActiveRefreshSessionByTokenHash(
    hashRefreshToken(input.refreshToken),
    now
  );

  if (!refreshSession) {
    return;
  }

  await revokeRefreshSession(refreshSession.id, now);
}
