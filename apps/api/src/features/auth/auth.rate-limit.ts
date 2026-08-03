import { createHash } from 'node:crypto';

import { AuthRateLimitExceededError } from './auth.errors.js';
import type {
  AuthRateLimitAction,
  AuthRateLimitScope
} from './auth.rate-limit.domain.js';
import {
  clearAuthRateLimit,
  incrementAuthRateLimit,
  releaseAuthRateLimit
} from './auth.rate-limit.repository.js';

const millisecondsPerSecond = 1000;
const authRateLimitWindowSeconds = 15 * 60;
const loginAttemptLimit = 10;
const registrationAttemptLimit = 3;
const passwordResetRequestLimit = 3;
const passwordResetVerificationLimit = 5;
const networkLoginAttemptLimit = 30;
const networkRegistrationAttemptLimit = 10;
const networkPasswordResetRequestLimit = 10;
const networkPasswordResetVerificationLimit = 30;

function getAccountAttemptLimit(action: AuthRateLimitAction): number {
  switch (action) {
    case 'login':
      return loginAttemptLimit;
    case 'register':
      return registrationAttemptLimit;
    case 'registration-verify':
      return passwordResetVerificationLimit;
    case 'password-reset-request':
      return passwordResetRequestLimit;
    case 'password-reset-verify':
      return passwordResetVerificationLimit;
  }
}

function getNetworkAttemptLimit(action: AuthRateLimitAction): number {
  switch (action) {
    case 'login':
      return networkLoginAttemptLimit;
    case 'register':
      return networkRegistrationAttemptLimit;
    case 'registration-verify':
      return networkPasswordResetVerificationLimit;
    case 'password-reset-request':
      return networkPasswordResetRequestLimit;
    case 'password-reset-verify':
      return networkPasswordResetVerificationLimit;
  }
}

function getAttemptLimit(action: AuthRateLimitAction, scope: AuthRateLimitScope): number {
  return scope === 'account'
    ? getAccountAttemptLimit(action)
    : getNetworkAttemptLimit(action);
}

function createRateLimitKey(
  action: AuthRateLimitAction,
  scope: AuthRateLimitScope,
  subject: string
): string {
  return createHash('sha256')
    .update(action)
    .update('\0')
    .update(scope)
    .update('\0')
    .update(subject)
    .digest('hex');
}

export async function consumeAuthAttempt(
  action: AuthRateLimitAction,
  scope: AuthRateLimitScope,
  subject: string,
  now: Date = new Date()
): Promise<void> {
  const windowMilliseconds = authRateLimitWindowSeconds * millisecondsPerSecond;
  const rateLimit = await incrementAuthRateLimit(
    createRateLimitKey(action, scope, subject),
    now,
    new Date(now.getTime() - windowMilliseconds)
  );

  if (rateLimit.attempts <= getAttemptLimit(action, scope)) {
    return;
  }

  const retryAfterMilliseconds = rateLimit.windowStartedAt.getTime()
    + windowMilliseconds
    - now.getTime();

  throw new AuthRateLimitExceededError(
    Math.max(1, Math.ceil(retryAfterMilliseconds / millisecondsPerSecond))
  );
}

export async function clearAuthAccountAttempts(
  action: AuthRateLimitAction,
  subject: string
): Promise<void> {
  await clearAuthRateLimit(createRateLimitKey(action, 'account', subject));
}

export async function tryConsumeAuthAccountAttempt(
  action: AuthRateLimitAction,
  subject: string,
  now: Date = new Date()
): Promise<boolean> {
  try {
    await consumeAuthAttempt(action, 'account', subject, now);
    return true;
  } catch (error: unknown) {
    if (error instanceof AuthRateLimitExceededError) {
      return false;
    }

    throw error;
  }
}

export async function releaseAuthNetworkAttempt(
  action: AuthRateLimitAction,
  subject: string
): Promise<void> {
  await releaseAuthRateLimit(createRateLimitKey(action, 'network', subject));
}
