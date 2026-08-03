import { randomBytes, randomUUID } from 'node:crypto';

import {
  refreshSessionTtlSeconds,
  type AuthResponse,
  type LoginRequest
} from '@health/shared';

import { createRefreshTokenValue, hashRefreshToken } from './auth.refresh-session.js';
import { createAccessToken } from './auth.token.js';
import type { AuthSessionUser } from './auth.domain.js';
import {
  InvalidCredentialsError,
  InvalidRefreshSessionError
} from './auth.errors.js';
import { hashPassword, needsPasswordRehash, verifyPassword } from './auth.password.js';
import {
  clearAuthAccountAttempts,
  consumeAuthAttempt,
  releaseAuthNetworkAttempt
} from './auth.rate-limit.js';
import {
  createRefreshSession,
  getUserCredentialsByEmail,
  revokeRefreshSessionFamilyByTokenHash,
  rotateRefreshSession,
  updateUserPasswordHashIfCurrent
} from './auth.repository.js';

const millisecondsPerSecond = 1000;
const refreshSessionTtlMs = refreshSessionTtlSeconds * millisecondsPerSecond;
const fallbackPasswordBytes = 32;
const fallbackPasswordHashPromise = hashPassword(
  randomBytes(fallbackPasswordBytes).toString('base64url')
);

type RefreshTokenInput = {
  refreshToken: string;
};

type AuthSessionResponse = Omit<AuthResponse, 'refreshToken'> & {
  refreshToken: string;
};

function getFallbackPasswordHash(): Promise<string> {
  return fallbackPasswordHashPromise;
}

function buildAuthResponse(user: AuthSessionUser, refreshToken: string): AuthSessionResponse {
  return {
    accessToken: createAccessToken({
      id: user.id,
      authVersion: user.authVersion
    }),
    refreshToken,
    user: {
      id: user.id,
      email: user.email
    }
  };
}

async function createAuthSession(
  user: AuthSessionUser,
  now: Date
): Promise<AuthSessionResponse> {
  const refreshToken = createRefreshTokenValue();
  const sessionId = randomUUID();

  await createRefreshSession({
    id: sessionId,
    familyId: sessionId,
    userId: user.id,
    authVersion: user.authVersion,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: new Date(now.getTime() + refreshSessionTtlMs),
    createdAt: now
  });

  return buildAuthResponse(user, refreshToken);
}

export async function loginUser(
  input: LoginRequest,
  clientAddress: string
): Promise<AuthSessionResponse> {
  await consumeAuthAttempt('login', 'network', clientAddress);
  const user = await getUserCredentialsByEmail(input.email);
  const passwordHash = user?.passwordHash ?? await getFallbackPasswordHash();
  const passwordMatches = await verifyPassword(input.password, passwordHash);

  if (!user?.passwordHash || !passwordMatches) {
    await consumeAuthAttempt('login', 'account', input.email);
    throw new InvalidCredentialsError();
  }

  await clearAuthAccountAttempts('login', input.email);
  await releaseAuthNetworkAttempt('login', clientAddress);

  if (needsPasswordRehash(user.passwordHash)) {
    await updateUserPasswordHashIfCurrent(
      user.id,
      user.passwordHash,
      await hashPassword(input.password)
    );
  }

  return createAuthSession(user, new Date());
}

export async function refreshAuthSession(
  input: RefreshTokenInput,
  now: Date = new Date()
): Promise<AuthSessionResponse> {
  const refreshToken = createRefreshTokenValue();
  const user = await rotateRefreshSession(
    hashRefreshToken(input.refreshToken),
    {
      id: randomUUID(),
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(now.getTime() + refreshSessionTtlMs),
      createdAt: now
    },
    now
  );

  if (!user) {
    throw new InvalidRefreshSessionError();
  }

  return buildAuthResponse(user, refreshToken);
}

export async function logoutUser(input: RefreshTokenInput, now: Date = new Date()): Promise<void> {
  await revokeRefreshSessionFamilyByTokenHash(
    hashRefreshToken(input.refreshToken),
    now
  );
}
