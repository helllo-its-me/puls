import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

import { getCurrentAuthSecret, getPreviousAuthSecrets } from './auth-secret.js';

const tokenHeaderSchema = z.object({
  alg: z.literal('HS256'),
  typ: z.literal('JWT')
});
const tokenPayloadSchema = z.object({
  sub: z.string(),
  av: z.number().int().nonnegative().default(0),
  exp: z.number()
});

export type TokenPayload = {
  sub: string;
  av: number;
  exp: number;
};

function getVerificationSecrets(): string[] {
  return [getCurrentAuthSecret(), ...getPreviousAuthSecrets()];
}

export function assertAuthTokenConfig(): void {
  getVerificationSecrets();
}

function encodeJson(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAccessToken(user: { id: string; authVersion: number }): string {
  const header = encodeJson({
    alg: 'HS256',
    typ: 'JWT'
  });
  const payload = encodeJson({
    sub: user.id,
    av: user.authVersion,
    exp: Math.floor(Date.now() / 1000) + 60 * 60
  });
  const unsignedToken = `${header}.${payload}`;
  const signature = sign(unsignedToken, getCurrentAuthSecret());

  return `${unsignedToken}.${signature}`;
}

export function verifyAccessToken(token: string): TokenPayload | null {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, signature] = parts;

  if (!header || !payload || !signature) {
    return null;
  }

  const isSignatureValid = getVerificationSecrets().some((secret) =>
    safeEqual(signature, sign(`${header}.${payload}`, secret))
  );

  if (!isSignatureValid) {
    return null;
  }

  try {
    const parsedHeader: unknown = JSON.parse(Buffer.from(header, 'base64url').toString('utf8'));

    if (!tokenHeaderSchema.safeParse(parsedHeader).success) {
      return null;
    }

    const parsedPayload: unknown = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const tokenPayload = tokenPayloadSchema.safeParse(parsedPayload);

    if (!tokenPayload.success) {
      return null;
    }

    if (tokenPayload.data.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return tokenPayload.data;
  } catch {
    return null;
  }
}

export function getBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice('Bearer '.length);
}
