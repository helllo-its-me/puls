import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';

import {
  emailVerificationCodeTtlSeconds,
  type RegisterRequest,
  type RegisterRequestResponse,
  type RegisterVerifyRequest
} from '@health/shared';

import { InvalidEmailVerificationCodeError } from './auth.errors.js';
import { hashPassword, verifyPassword } from './auth.password.js';
import { waitForMinimumAuthResponse } from './auth-response-timing.js';
import {
  clearAuthAccountAttempts,
  consumeAuthAttempt,
  releaseAuthNetworkAttempt,
  tryConsumeAuthAccountAttempt
} from './auth.rate-limit.js';
import { encryptPasswordResetCode } from './password-reset-email.cipher.js';
import {
  createRegistrationAttempt,
  getActiveRegistrationAttempt,
  verifyRegistrationAttempt
} from './registration.repository.js';

const millisecondsPerSecond = 1000;
const codeMinimum = 100000;
const codeMaximum = 1000000;
const codeTtlMilliseconds = emailVerificationCodeTtlSeconds * millisecondsPerSecond;
const registrationTokenBytes = 32;
const fallbackCodeHashPromise = hashPassword(String(randomInt(codeMinimum, codeMaximum)));

function createVerificationCode(): string {
  return String(randomInt(codeMinimum, codeMaximum));
}

function createRegistrationToken(): string {
  return randomBytes(registrationTokenBytes).toString('base64url');
}

function hashRegistrationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function registerUser(
  input: RegisterRequest,
  clientAddress: string,
  minimumResponseMilliseconds: number,
  now: Date = new Date()
): Promise<RegisterRequestResponse> {
  const startedAt = Date.now();
  await consumeAuthAttempt('register', 'network', clientAddress, now);
  const canCreateAttempt = await tryConsumeAuthAccountAttempt(
    'register',
    input.email,
    now
  );
  const code = createVerificationCode();
  const encryptedCode = encryptPasswordResetCode(code);
  const registrationToken = createRegistrationToken();
  const attempt = {
    id: randomUUID(),
    registrationTokenHash: hashRegistrationToken(registrationToken),
    userId: randomUUID(),
    profileId: randomUUID(),
    email: input.email,
    passwordHash: await hashPassword(input.password),
    firstName: input.firstName,
    lastName: input.lastName,
    codeHash: await hashPassword(code),
    encryptedCode,
    codeExpiresAt: new Date(now.getTime() + codeTtlMilliseconds),
    emailJobId: randomUUID(),
    createdAt: now
  };

  if (canCreateAttempt) {
    await createRegistrationAttempt(attempt);
  }

  await waitForMinimumAuthResponse(startedAt, minimumResponseMilliseconds);

  return {
    status: 'ok',
    registrationToken
  };
}

export async function verifyRegisteredEmail(
  input: RegisterVerifyRequest,
  clientAddress: string,
  now: Date = new Date()
): Promise<void> {
  await consumeAuthAttempt('registration-verify', 'network', clientAddress, now);
  const registrationAttempt = await getActiveRegistrationAttempt(
    input.email,
    hashRegistrationToken(input.registrationToken),
    now
  );
  const codeHash = registrationAttempt?.codeHash ?? await fallbackCodeHashPromise;
  const codeMatches = await verifyPassword(input.code, codeHash);

  if (
    !registrationAttempt
    || !codeMatches
    || !await verifyRegistrationAttempt(registrationAttempt.id, input.email, now)
  ) {
    await consumeAuthAttempt('registration-verify', 'account', input.email, now);
    throw new InvalidEmailVerificationCodeError();
  }

  await clearAuthAccountAttempts('registration-verify', input.email);
  await releaseAuthNetworkAttempt('registration-verify', clientAddress);
}
