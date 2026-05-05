import { createHash, randomBytes } from 'node:crypto';

const refreshTokenBytes = 32;

export function createRefreshTokenValue(): string {
  return randomBytes(refreshTokenBytes).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
