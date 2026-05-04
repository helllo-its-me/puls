import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

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

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
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
