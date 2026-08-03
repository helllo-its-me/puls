import {
  db,
  passwordResetEmailJobsTable,
  passwordResetCodesTable,
  refreshSessionFamiliesTable,
  refreshSessionsTable,
  usersTable
} from '@health/db';
import { and, desc, eq, gt, isNotNull, isNull, lte, ne, or, sql } from 'drizzle-orm';

import type { CreatePasswordResetCodeInput, PasswordResetCode } from './password-reset.domain.js';
import {
  passwordChangedEmailJobKind,
  type CreatePasswordResetEmailJobInput
} from './password-reset-email-job.domain.js';

function mapPasswordResetCode(
  resetCode: typeof passwordResetCodesTable.$inferSelect
): PasswordResetCode {
  return {
    id: resetCode.id,
    email: resetCode.email,
    codeHash: resetCode.codeHash,
    encryptedCode: resetCode.encryptedCode,
    expiresAt: resetCode.expiresAt,
    resetTokenHash: resetCode.resetTokenHash,
    resetTokenExpiresAt: resetCode.resetTokenExpiresAt,
    verifiedAt: resetCode.verifiedAt,
    usedAt: resetCode.usedAt,
    createdAt: resetCode.createdAt
  };
}

export async function createOrReusePasswordResetCodeWithEmailJob(
  input: CreatePasswordResetCodeInput,
  emailJob: CreatePasswordResetEmailJobInput
): Promise<void> {
  await db.transaction(async (tx) => {
    const users = await tx
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1)
      .for('update');

    if (!users[0]) {
      return;
    }

    await tx
      .delete(passwordResetCodesTable)
      .where(
        or(
          isNotNull(passwordResetCodesTable.usedAt),
          and(
            isNull(passwordResetCodesTable.resetTokenHash),
            lte(passwordResetCodesTable.expiresAt, input.createdAt)
          ),
          lte(passwordResetCodesTable.resetTokenExpiresAt, input.createdAt)
        )
      );

    await tx
      .update(passwordResetCodesTable)
      .set({ usedAt: input.createdAt })
      .where(and(
        eq(passwordResetCodesTable.email, input.email),
        isNotNull(passwordResetCodesTable.verifiedAt),
        isNull(passwordResetCodesTable.usedAt)
      ));

    const activeCodes = await tx
      .select()
      .from(passwordResetCodesTable)
      .where(
        and(
          eq(passwordResetCodesTable.email, input.email),
          isNull(passwordResetCodesTable.verifiedAt),
          isNull(passwordResetCodesTable.usedAt),
          gt(passwordResetCodesTable.expiresAt, input.createdAt)
        )
      )
      .orderBy(desc(passwordResetCodesTable.createdAt))
      .limit(1)
      .for('update');
    const activeCode = activeCodes[0];

    if (activeCode?.encryptedCode) {
      await tx
        .update(passwordResetCodesTable)
        .set({ expiresAt: input.expiresAt })
        .where(eq(passwordResetCodesTable.id, activeCode.id));
      await tx.insert(passwordResetEmailJobsTable).values({
        ...emailJob,
        encryptedCode: activeCode.encryptedCode
      });

      return;
    }

    if (activeCode) {
      await tx
        .update(passwordResetCodesTable)
        .set({ usedAt: input.createdAt })
        .where(eq(passwordResetCodesTable.id, activeCode.id));
    }

    await tx.insert(passwordResetCodesTable).values(input);
    await tx.insert(passwordResetEmailJobsTable).values(emailJob);
  });
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

export async function markPasswordResetCodeVerified(
  id: string,
  verifiedAt: Date,
  resetTokenHash: string,
  resetTokenExpiresAt: Date
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .update(passwordResetCodesTable)
      .set({
        resetTokenHash,
        resetTokenExpiresAt,
        verifiedAt
      })
      .where(
        and(
          eq(passwordResetCodesTable.id, id),
          isNull(passwordResetCodesTable.verifiedAt),
          isNull(passwordResetCodesTable.usedAt),
          gt(passwordResetCodesTable.expiresAt, verifiedAt)
        )
      )
      .returning({ email: passwordResetCodesTable.email });
    const verifiedCode = rows[0];

    if (!verifiedCode) {
      return false;
    }

    await tx
      .update(passwordResetCodesTable)
      .set({ usedAt: verifiedAt })
      .where(
        and(
          eq(passwordResetCodesTable.email, verifiedCode.email),
          ne(passwordResetCodesTable.id, id),
          isNull(passwordResetCodesTable.usedAt)
        )
      );

    return true;
  });
}

export async function hasActivePasswordResetTokenHash(
  resetTokenHash: string,
  now: Date
): Promise<boolean> {
  const rows = await db
    .select({ id: passwordResetCodesTable.id })
    .from(passwordResetCodesTable)
    .where(
      and(
        eq(passwordResetCodesTable.resetTokenHash, resetTokenHash),
        isNotNull(passwordResetCodesTable.verifiedAt),
        isNull(passwordResetCodesTable.usedAt),
        gt(passwordResetCodesTable.resetTokenExpiresAt, now)
      )
    )
    .limit(1);

  return Boolean(rows[0]);
}

export async function completePasswordResetByTokenHash(
  resetTokenHash: string,
  passwordHash: string,
  emailJobId: string,
  completedAt: Date
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const claimedResetCodes = await tx
      .update(passwordResetCodesTable)
      .set({ usedAt: completedAt })
      .where(
        and(
          eq(passwordResetCodesTable.resetTokenHash, resetTokenHash),
          isNotNull(passwordResetCodesTable.verifiedAt),
          isNull(passwordResetCodesTable.usedAt),
          gt(passwordResetCodesTable.resetTokenExpiresAt, completedAt)
        )
      )
      .returning({ email: passwordResetCodesTable.email });
    const claimedResetCode = claimedResetCodes[0];

    if (!claimedResetCode) {
      return false;
    }

    const updatedUsers = await tx
      .update(usersTable)
      .set({
        passwordHash,
        authVersion: sql<number>`${usersTable.authVersion} + 1`
      })
      .where(eq(usersTable.email, claimedResetCode.email))
      .returning({ id: usersTable.id });
    const updatedUser = updatedUsers[0];

    if (!updatedUser) {
      throw new Error('Password reset user was not found');
    }

    await tx
      .update(refreshSessionFamiliesTable)
      .set({ revokedAt: completedAt })
      .where(
        and(
          eq(refreshSessionFamiliesTable.userId, updatedUser.id),
          isNull(refreshSessionFamiliesTable.revokedAt)
        )
      );

    await tx
      .update(refreshSessionsTable)
      .set({ revokedAt: completedAt })
      .where(
        and(
          eq(refreshSessionsTable.userId, updatedUser.id),
          isNull(refreshSessionsTable.revokedAt)
        )
      );

    await tx
      .update(passwordResetCodesTable)
      .set({ usedAt: completedAt })
      .where(
        and(
          eq(passwordResetCodesTable.email, claimedResetCode.email),
          isNull(passwordResetCodesTable.usedAt)
        )
      );

    await tx.insert(passwordResetEmailJobsTable).values({
      id: emailJobId,
      kind: passwordChangedEmailJobKind,
      email: claimedResetCode.email,
      encryptedCode: null,
      codeExpiresAt: null,
      availableAt: completedAt,
      createdAt: completedAt
    });

    return true;
  });
}
