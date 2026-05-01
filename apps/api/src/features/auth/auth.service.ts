import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

import type { AuthResponse, LoginRequest, RegisterRequest } from '@health/shared';

import { createAccessToken } from './auth.token.js';
import {
  createUserWithProfile,
  getUserCredentialsByEmail
} from './auth.repository.js';

const passwordKeyLength = 64;

function scrypt(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, passwordKeyLength, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const derivedKey = await scrypt(password, salt);

  return `${salt}:${derivedKey.toString('base64url')}`;
}

async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [salt, storedKey] = passwordHash.split(':');

  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = await scrypt(password, salt);
  const storedKeyBuffer = Buffer.from(storedKey, 'base64url');

  if (derivedKey.length !== storedKeyBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedKeyBuffer);
}

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
