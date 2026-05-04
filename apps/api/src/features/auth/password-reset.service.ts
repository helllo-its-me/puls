import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';

import type {
  PasswordResetCompleteRequest,
  PasswordResetRequest,
  PasswordResetVerifyResponse,
  PasswordResetVerifyRequest
} from '@health/shared';
import { passwordResetCodeTtlSeconds, passwordResetSessionTtlSeconds } from '@health/shared';

import { hashPassword, verifyPassword } from './auth.password.js';
import { devPasswordResetEmailSender, type PasswordResetEmailSender } from './password-reset-email.js';
import {
  createPasswordResetCode,
  getActivePasswordResetCodeByTokenHash,
  getLatestActivePasswordResetCode,
  markPasswordResetCodeUsed,
  markPasswordResetCodeVerified,
  updateUserPasswordByEmail,
  userExistsByEmail
} from './password-reset.repository.js';

const millisecondsPerSecond = 1000;
const passwordResetCodeTtlMs = passwordResetCodeTtlSeconds * millisecondsPerSecond;
const passwordResetSessionTtlMs = passwordResetSessionTtlSeconds * millisecondsPerSecond;
const passwordResetCodeMin = 100000;
const passwordResetCodeMax = 1000000;
const passwordResetTokenBytes = 32;

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

  if (!resetCode) {
    throw new Error('Invalid or expired reset code');
  }

  const isCodeValid = await verifyPassword(input.code, resetCode.codeHash);

  if (!isCodeValid) {
    throw new Error('Invalid or expired reset code');
  }

  return resetCode;
}

export async function requestPasswordReset(
  input: PasswordResetRequest,
  emailSender: PasswordResetEmailSender = devPasswordResetEmailSender
): Promise<void> {
  const userExists = await userExistsByEmail(input.email);

  if (!userExists) {
    return;
  }

  const now = new Date();
  const code = createPasswordResetCodeValue();
  const expiresAt = new Date(now.getTime() + passwordResetCodeTtlMs);

  await createPasswordResetCode({
    id: randomUUID(),
    email: input.email,
    codeHash: await hashPassword(code),
    expiresAt,
    createdAt: now
  });
  await emailSender.sendPasswordResetCode({
    email: input.email,
    code,
    expiresAt
  });
}

export async function verifyPasswordResetCode(
  input: PasswordResetVerifyRequest,
  now: Date = new Date()
): Promise<PasswordResetVerifyResponse> {
  const resetCode = await getVerifiedResetCode(input, now);
  const resetToken = createPasswordResetTokenValue();

  await markPasswordResetCodeVerified(
    resetCode.id,
    now,
    hashPasswordResetToken(resetToken),
    new Date(now.getTime() + passwordResetSessionTtlMs)
  );

  return {
    resetToken
  };
}

export async function completePasswordReset(
  input: PasswordResetCompleteRequest,
  now: Date = new Date()
): Promise<void> {
  const resetCode = await getActivePasswordResetCodeByTokenHash(
    hashPasswordResetToken(input.resetToken),
    now
  );

  if (!resetCode || !resetCode.verifiedAt) {
    throw new Error('Invalid or expired password reset session');
  }

  await updateUserPasswordByEmail(resetCode.email, await hashPassword(input.password));
  await markPasswordResetCodeUsed(resetCode.id, now);
}
