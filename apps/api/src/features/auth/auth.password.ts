import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

const passwordKeyLength = 64;
const passwordSaltBytes = 16;
const passwordHashVersion = 'scrypt';
const passwordScryptMaximumMemory = 64 * 1024 * 1024;

type ScryptParameters = {
  cost: number;
  blockSize: number;
  parallelization: number;
};

type ScryptProfile = ScryptParameters & {
  id: string;
};

const legacyScryptParameters: ScryptParameters = {
  cost: 2 ** 14,
  blockSize: 8,
  parallelization: 1
};
const scryptV1Profile: ScryptProfile = {
  id: 'v1',
  cost: 2 ** 15,
  blockSize: 8,
  parallelization: 3
};
const supportedScryptProfiles: readonly ScryptProfile[] = [scryptV1Profile];
const currentScryptProfile = scryptV1Profile;

function scrypt(
  password: string,
  salt: string,
  parameters: ScryptParameters
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      passwordKeyLength,
      {
        N: parameters.cost,
        r: parameters.blockSize,
        p: parameters.parallelization,
        maxmem: passwordScryptMaximumMemory
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      }
    );
  });
}

function parsePasswordHash(passwordHash: string): {
  parameters: ScryptParameters;
  profileId: string | null;
  salt: string;
  storedKey: string;
} | null {
  const parts = passwordHash.split(':');

  if (parts.length === 2) {
    const [salt, storedKey] = parts;

    return salt && storedKey
      ? {
          parameters: legacyScryptParameters,
          profileId: null,
          salt,
          storedKey
        }
      : null;
  }

  if (parts.length === 4) {
    const [version, profileId, salt, storedKey] = parts;
    const profile = supportedScryptProfiles.find((candidate) => candidate.id === profileId);

    return version === passwordHashVersion && profile && salt && storedKey
      ? {
          parameters: profile,
          profileId: profile.id,
          salt,
          storedKey
        }
      : null;
  }

  const [version, costValue, blockSizeValue, parallelizationValue, salt, storedKey] = parts;
  const profile = supportedScryptProfiles.find((candidate) => (
    costValue === String(candidate.cost)
    && blockSizeValue === String(candidate.blockSize)
    && parallelizationValue === String(candidate.parallelization)
  ));

  if (
    parts.length !== 6
    || version !== passwordHashVersion
    || !profile
    || !salt
    || !storedKey
  ) {
    return null;
  }

  return {
    parameters: profile,
    profileId: profile.id,
    salt,
    storedKey
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(passwordSaltBytes).toString('base64url');
  const derivedKey = await scrypt(password, salt, currentScryptProfile);

  return [
    passwordHashVersion,
    currentScryptProfile.id,
    salt,
    derivedKey.toString('base64url')
  ].join(':');
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const parsedPasswordHash = parsePasswordHash(passwordHash);

  if (!parsedPasswordHash) {
    return false;
  }

  const derivedKey = await scrypt(
    password,
    parsedPasswordHash.salt,
    parsedPasswordHash.parameters
  );
  const storedKeyBuffer = Buffer.from(parsedPasswordHash.storedKey, 'base64url');

  if (derivedKey.length !== storedKeyBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedKeyBuffer);
}

export function needsPasswordRehash(passwordHash: string): boolean {
  const parsedPasswordHash = parsePasswordHash(passwordHash);

  return !parsedPasswordHash
    || parsedPasswordHash.profileId !== currentScryptProfile.id;
}
