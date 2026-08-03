import postgres from 'postgres';

import { decryptPasswordResetCode } from '../../apps/api/src/features/auth/password-reset-email.cipher';
import { getDatabaseUrl } from '../../packages/db/src/database-url';
import { e2eAuthTokenSecret } from './e2e-auth.config';

export async function getEmailVerificationCode(email: string): Promise<string> {
  process.env.NODE_ENV = 'test';
  process.env.AUTH_TOKEN_SECRET = e2eAuthTokenSecret;
  const sql = postgres(getDatabaseUrl(), { max: 1 });

  try {
    const rows = await sql<{ encrypted_code: string }[]>`
      SELECT encrypted_code
      FROM registration_attempts
      WHERE email = ${email}
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const encryptedCode = rows[0]?.encrypted_code;

    if (!encryptedCode) {
      throw new Error(`Active email verification code was not found for ${email}`);
    }

    return decryptPasswordResetCode(encryptedCode);
  } finally {
    await sql.end();
  }
}
