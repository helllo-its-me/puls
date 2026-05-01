import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const tokenPayloadSchema = z.object({
  sub: z.string(),
  email: z.string(),
  exp: z.number()
});

export type TokenPayload = {
  sub: string;
  email: string;
  exp: number;
};

function getCurrentAuthTokenSecret(): string {
  const secret = process.env.AUTH_TOKEN_SECRET;

  if (!secret) {
    throw new Error('AUTH_TOKEN_SECRET is required');
  }

  return secret;
}

function getPreviousAuthTokenSecrets(): string[] {
  return (process.env.AUTH_TOKEN_PREVIOUS_SECRETS ?? '')
    .split(',')
    .map((secret) => secret.trim())
    .filter((secret) => secret.length > 0);
}

function getVerificationSecrets(): string[] {
  return [getCurrentAuthTokenSecret(), ...getPreviousAuthTokenSecrets()];
}

export function assertAuthTokenConfig(): void {
  getCurrentAuthTokenSecret();
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

export function createAccessToken(user: { id: string; email: string }): string {
  const header = encodeJson({
    alg: 'HS256',
    typ: 'JWT'
  });
  const payload = encodeJson({
    sub: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60
  });
  const unsignedToken = `${header}.${payload}`;
  const signature = sign(unsignedToken, getCurrentAuthTokenSecret());

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
