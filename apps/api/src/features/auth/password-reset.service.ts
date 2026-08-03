import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';

import type {
  PasswordResetCompleteRequest,
  PasswordResetRequest,
  PasswordResetRequestResponse,
  PasswordResetVerifyResponse,
  PasswordResetVerifyRequest
} from '@health/shared';
import { passwordResetCodeTtlSeconds, passwordResetSessionTtlSeconds } from '@health/shared';

import {
  InvalidPasswordResetCodeError,
  InvalidPasswordResetSessionError
} from './auth.errors.js';
import { hashPassword, verifyPassword } from './auth.password.js';
import { waitForMinimumAuthResponse } from './auth-response-timing.js';
import {
  clearAuthAccountAttempts,
  consumeAuthAttempt,
  releaseAuthNetworkAttempt,
  tryConsumeAuthAccountAttempt
} from './auth.rate-limit.js';
import { encryptPasswordResetCode } from './password-reset-email.cipher.js';
import { passwordResetCodeEmailJobKind } from './password-reset-email-job.domain.js';
import {
  completePasswordResetByTokenHash,
  createOrReusePasswordResetCodeWithEmailJob,
  getLatestActivePasswordResetCode,
  hasActivePasswordResetTokenHash,
  markPasswordResetCodeVerified
} from './password-reset.repository.js';

const millisecondsPerSecond = 1000;
const passwordResetCodeTtlMs = passwordResetCodeTtlSeconds * millisecondsPerSecond;
const passwordResetSessionTtlMs = passwordResetSessionTtlSeconds * millisecondsPerSecond;
const passwordResetCodeMin = 100000;
const passwordResetCodeMax = 1000000;
const passwordResetTokenBytes = 32;
const fallbackResetCodeHashPromise = hashPassword(
  String(randomInt(passwordResetCodeMin, passwordResetCodeMax))
);

function createPasswordResetCodeValue(): string {
  return String(randomInt(passwordResetCodeMin, passwordResetCodeMax));
}

function createPasswordResetTokenValue(): string {
  return randomBytes(passwordResetTokenBytes).toString('base64url');
}

function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function getVerifiedResetCode(input: PasswordResetVerifyRequest, now: Date) {
  const resetCode = await getLatestActivePasswordResetCode(input.email, now);
  const codeHash = resetCode?.codeHash ?? await fallbackResetCodeHashPromise;
  const isCodeValid = await verifyPassword(input.code, codeHash);

  if (!resetCode || !isCodeValid) {
    throw new InvalidPasswordResetCodeError();
  }

  return resetCode;
}

async function rejectInvalidResetCode(
  input: PasswordResetVerifyRequest,
  now: Date
): Promise<never> {
  await consumeAuthAttempt('password-reset-verify', 'account', input.email, now);
  throw new InvalidPasswordResetCodeError();
}

async function getVerifiedResetCodeForAttempt(
  input: PasswordResetVerifyRequest,
  now: Date
) {
  try {
    return await getVerifiedResetCode(input, now);
  } catch (error: unknown) {
    if (!(error instanceof InvalidPasswordResetCodeError)) {
      throw error;
    }

    return rejectInvalidResetCode(input, now);
  }
}

export async function requestPasswordReset(
  input: PasswordResetRequest,
  clientAddress: string,
  minimumResponseMilliseconds: number,
  now: Date = new Date()
): Promise<PasswordResetRequestResponse> {
  const startedAt = Date.now();
  await consumeAuthAttempt('password-reset-request', 'network', clientAddress, now);
  const canCreateResetCode = await tryConsumeAuthAccountAttempt(
    'password-reset-request',
    input.email,
    now
  );
  const expiresAt = new Date(now.getTime() + passwordResetCodeTtlMs);
  const code = createPasswordResetCodeValue();
  const encryptedCode = encryptPasswordResetCode(code);
  const resetCode = {
    id: randomUUID(),
    email: input.email,
    codeHash: await hashPassword(code),
    encryptedCode,
    expiresAt,
    createdAt: now
  };

  if (canCreateResetCode) {
    await createOrReusePasswordResetCodeWithEmailJob(
      resetCode,
      {
        id: randomUUID(),
        kind: passwordResetCodeEmailJobKind,
        email: input.email,
        encryptedCode,
        codeExpiresAt: expiresAt,
        availableAt: now,
        createdAt: now
      }
    );
  }

  await waitForMinimumAuthResponse(startedAt, minimumResponseMilliseconds);

  return {
    status: 'ok',
    expiresAt: expiresAt.toISOString()
  };
}

export async function verifyPasswordResetCode(
  input: PasswordResetVerifyRequest,
  clientAddress: string,
  now: Date = new Date()
): Promise<PasswordResetVerifyResponse> {
  await consumeAuthAttempt('password-reset-verify', 'network', clientAddress, now);
  const resetCode = await getVerifiedResetCodeForAttempt(input, now);
  const resetToken = createPasswordResetTokenValue();

  const wasVerified = await markPasswordResetCodeVerified(
    resetCode.id,
    now,
    hashPasswordResetToken(resetToken),
    new Date(now.getTime() + passwordResetSessionTtlMs)
  );

  if (!wasVerified) {
    return rejectInvalidResetCode(input, now);
  }

  await clearAuthAccountAttempts('password-reset-verify', input.email);
  await releaseAuthNetworkAttempt('password-reset-verify', clientAddress);

  return {
    resetToken
  };
}

export async function completePasswordReset(
  input: PasswordResetCompleteRequest,
  now: Date = new Date()
): Promise<void> {
  const resetTokenHash = hashPasswordResetToken(input.resetToken);
  const isActive = await hasActivePasswordResetTokenHash(resetTokenHash, now);

  if (!isActive) {
    throw new InvalidPasswordResetSessionError();
  }

  const wasCompleted = await completePasswordResetByTokenHash(
    resetTokenHash,
    await hashPassword(input.password),
    randomUUID(),
    now
  );

  if (!wasCompleted) {
    throw new InvalidPasswordResetSessionError();
  }
}
