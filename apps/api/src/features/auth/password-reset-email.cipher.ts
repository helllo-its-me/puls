import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes
} from 'node:crypto';

import { getCurrentAuthSecret, getPreviousAuthSecrets } from './auth-secret.js';

const cipherAlgorithm = 'aes-256-gcm';
const cipherVersion = 'v1';
const initializationVectorBytes = 12;
const keyContext = 'puls-password-reset-email-code';

function createEncryptionKey(secret: string): Buffer {
  return createHash('sha256')
    .update(secret)
    .update('\0')
    .update(keyContext)
    .digest();
}

export function encryptPasswordResetCode(code: string): string {
  const initializationVector = randomBytes(initializationVectorBytes);
  const cipher = createCipheriv(
    cipherAlgorithm,
    createEncryptionKey(getCurrentAuthSecret()),
    initializationVector
  );
  const encryptedCode = Buffer.concat([cipher.update(code, 'utf8'), cipher.final()]);

  return [
    cipherVersion,
    initializationVector.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encryptedCode.toString('base64url')
  ].join('.');
}

function decryptWithSecret(
  initializationVectorValue: string,
  authTagValue: string,
  encryptedCodeValue: string,
  secret: string
): string {
  const decipher = createDecipheriv(
    cipherAlgorithm,
    createEncryptionKey(secret),
    Buffer.from(initializationVectorValue, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedCodeValue, 'base64url')),
    decipher.final()
  ]).toString('utf8');
}

export function decryptPasswordResetCode(value: string): string {
  const [version, initializationVectorValue, authTagValue, encryptedCodeValue] = value.split('.');

  if (
    version !== cipherVersion
    || !initializationVectorValue
    || !authTagValue
    || !encryptedCodeValue
  ) {
    throw new Error('Invalid encrypted password reset code');
  }

  const secrets = [getCurrentAuthSecret(), ...getPreviousAuthSecrets()];

  for (const secret of secrets) {
    try {
      return decryptWithSecret(
        initializationVectorValue,
        authTagValue,
        encryptedCodeValue,
        secret
      );
    } catch {
      continue;
    }
  }

  throw new Error('Password reset code could not be decrypted');
}
