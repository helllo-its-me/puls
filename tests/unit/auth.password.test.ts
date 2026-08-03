import { scrypt as scryptCallback } from 'node:crypto';

import { describe, expect, it } from 'vitest';

function legacyScrypt(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

describe('auth password hashing', () => {
  it('stores new passwords with explicit strong scrypt parameters', async () => {
    const { hashPassword, needsPasswordRehash, verifyPassword } = await import(
      '../../apps/api/src/features/auth/auth.password.js'
    );
    const passwordHash = await hashPassword('strong-password-value');

    expect(passwordHash).toMatch(/^scrypt:v1:/);
    await expect(verifyPassword('strong-password-value', passwordHash)).resolves.toBe(true);
    expect(needsPasswordRehash(passwordHash)).toBe(false);
  });

  it('verifies legacy hashes and marks them for transparent upgrade', async () => {
    const salt = 'legacy-salt';
    const derivedKey = await legacyScrypt('strong-password', salt);
    const legacyHash = `${salt}:${derivedKey.toString('base64url')}`;
    const { needsPasswordRehash, verifyPassword } = await import(
      '../../apps/api/src/features/auth/auth.password.js'
    );

    await expect(verifyPassword('strong-password', legacyHash)).resolves.toBe(true);
    expect(needsPasswordRehash(legacyHash)).toBe(true);
  });

  it('verifies the previous parameterized v1 format', async () => {
    const salt = 'parameterized-v1-salt';
    const derivedKey = await new Promise<Buffer>((resolve, reject) => {
      scryptCallback(
        'strong-password',
        salt,
        64,
        { N: 2 ** 15, r: 8, p: 3, maxmem: 64 * 1024 * 1024 },
        (error, key) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(key);
        }
      );
    });
    const parameterizedHash = `scrypt:32768:8:3:${salt}:${derivedKey.toString('base64url')}`;
    const { needsPasswordRehash, verifyPassword } = await import(
      '../../apps/api/src/features/auth/auth.password.js'
    );

    await expect(verifyPassword('strong-password', parameterizedHash)).resolves.toBe(true);
    expect(needsPasswordRehash(parameterizedHash)).toBe(false);
  });

  it('rejects stored hashes with attacker-controlled scrypt parameters', async () => {
    const { verifyPassword } = await import(
      '../../apps/api/src/features/auth/auth.password.js'
    );

    await expect(
      verifyPassword('strong-password', 'scrypt:1073741824:8:3:salt:key')
    ).resolves.toBe(false);
  });
});
