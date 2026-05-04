import { db, passwordResetCodesTable, usersTable } from '@health/db';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';

import type { CreatePasswordResetCodeInput, PasswordResetCode } from './password-reset.domain.js';

function mapPasswordResetCode(
  resetCode: typeof passwordResetCodesTable.$inferSelect
): PasswordResetCode {
  return {
    id: resetCode.id,
    email: resetCode.email,
    codeHash: resetCode.codeHash,
    expiresAt: resetCode.expiresAt,
    resetTokenHash: resetCode.resetTokenHash,
    resetTokenExpiresAt: resetCode.resetTokenExpiresAt,
    verifiedAt: resetCode.verifiedAt,
    usedAt: resetCode.usedAt,
    createdAt: resetCode.createdAt
  };
}

export async function userExistsByEmail(email: string): Promise<boolean> {
  const rows = await db
    .select({
      id: usersTable.id
    })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  return Boolean(rows[0]);
}

export async function createPasswordResetCode(
  input: CreatePasswordResetCodeInput
): Promise<void> {
  await db.insert(passwordResetCodesTable).values(input);
}

export async function getLatestActivePasswordResetCode(
  email: string,
  now: Date
): Promise<PasswordResetCode | null> {
  const rows = await db
    .select()
    .from(passwordResetCodesTable)
    .where(
      and(
        eq(passwordResetCodesTable.email, email),
        isNull(passwordResetCodesTable.usedAt),
        gt(passwordResetCodesTable.expiresAt, now)
      )
    )
    .orderBy(desc(passwordResetCodesTable.createdAt))
    .limit(1);

  const resetCode = rows[0];

  return resetCode ? mapPasswordResetCode(resetCode) : null;
}

export async function getActivePasswordResetCodeByTokenHash(
  resetTokenHash: string,
  now: Date
): Promise<PasswordResetCode | null> {
  const rows = await db
    .select()
    .from(passwordResetCodesTable)
    .where(
      and(
        eq(passwordResetCodesTable.resetTokenHash, resetTokenHash),
        isNull(passwordResetCodesTable.usedAt),
        gt(passwordResetCodesTable.resetTokenExpiresAt, now)
      )
    )
    .orderBy(desc(passwordResetCodesTable.createdAt))
    .limit(1);

  const resetCode = rows[0];

  return resetCode ? mapPasswordResetCode(resetCode) : null;
}

export async function markPasswordResetCodeVerified(
  id: string,
  verifiedAt: Date,
  resetTokenHash: string,
  resetTokenExpiresAt: Date
): Promise<void> {
  await db
    .update(passwordResetCodesTable)
    .set({
      resetTokenHash,
      resetTokenExpiresAt,
      verifiedAt
    })
    .where(eq(passwordResetCodesTable.id, id));
}

export async function markPasswordResetCodeUsed(id: string, usedAt: Date): Promise<void> {
  await db
    .update(passwordResetCodesTable)
    .set({
      usedAt
    })
    .where(eq(passwordResetCodesTable.id, id));
}

export async function updateUserPasswordByEmail(
  email: string,
  passwordHash: string
): Promise<void> {
  await db
    .update(usersTable)
    .set({
      passwordHash
    })
    .where(eq(usersTable.email, email));
}
