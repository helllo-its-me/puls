import { isLocalRuntimeMode, readRuntimeMode } from '../../app/runtime-mode.js';

const minimumAuthSecretLength = 32;
const hexadecimalAuthSecretPattern = /^[a-f0-9]{64}$/i;
const base64UrlAuthSecretPattern = /^[A-Za-z0-9_-]{43}$/;

function validateAuthSecret(secret: string): string {
  if (secret.length < minimumAuthSecretLength) {
    throw new Error(
      `AUTH_TOKEN_SECRET values must contain at least ${minimumAuthSecretLength} characters`
    );
  }

  if (
    !isLocalRuntimeMode(readRuntimeMode())
    && !hexadecimalAuthSecretPattern.test(secret)
    && !base64UrlAuthSecretPattern.test(secret)
  ) {
    throw new Error(
      'AUTH_TOKEN_SECRET values must encode exactly 32 random bytes as hex or base64url'
    );
  }

  return secret;
}

export function getCurrentAuthSecret(): string {
  const secret = process.env.AUTH_TOKEN_SECRET;

  if (!secret) {
    throw new Error('AUTH_TOKEN_SECRET is required');
  }

  return validateAuthSecret(secret);
}

export function getPreviousAuthSecrets(): string[] {
  return (process.env.AUTH_TOKEN_PREVIOUS_SECRETS ?? '')
    .split(',')
    .map((secret) => secret.trim())
    .filter((secret) => secret.length > 0)
    .map(validateAuthSecret);
}
