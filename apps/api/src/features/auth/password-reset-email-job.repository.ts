import { db, passwordResetEmailJobsTable } from '@health/db';
import { and, asc, eq, isNull, lte, or, sql } from 'drizzle-orm';

import {
  emailVerificationCodeEmailJobKind,
  passwordChangedEmailJobKind,
  passwordResetCodeEmailJobKind,
  type PasswordResetEmailJob
} from './password-reset-email-job.domain.js';

function mapEmailJob(
  row: typeof passwordResetEmailJobsTable.$inferSelect
): PasswordResetEmailJob {
  if (
    row.kind !== passwordResetCodeEmailJobKind
    && row.kind !== passwordChangedEmailJobKind
    && row.kind !== emailVerificationCodeEmailJobKind
  ) {
    throw new Error(`Unsupported password reset email job kind: ${row.kind}`);
  }

  return {
    id: row.id,
    kind: row.kind,
    email: row.email,
    encryptedCode: row.encryptedCode,
    codeExpiresAt: row.codeExpiresAt,
    attempts: row.attempts
  };
}

export async function claimPasswordResetEmailJob(
  now: Date,
  staleLockBefore: Date
): Promise<PasswordResetEmailJob | null> {
  return db.transaction(async (tx) => {
    const candidates = await tx
      .select()
      .from(passwordResetEmailJobsTable)
      .where(
        and(
          isNull(passwordResetEmailJobsTable.sentAt),
          isNull(passwordResetEmailJobsTable.failedAt),
          lte(passwordResetEmailJobsTable.availableAt, now),
          or(
            isNull(passwordResetEmailJobsTable.lockedAt),
            lte(passwordResetEmailJobsTable.lockedAt, staleLockBefore)
          )
        )
      )
      .orderBy(asc(passwordResetEmailJobsTable.createdAt))
      .limit(1)
      .for('update', { skipLocked: true });
    const candidate = candidates[0];

    if (!candidate) {
      return null;
    }

    const claimedRows = await tx
      .update(passwordResetEmailJobsTable)
      .set({
        attempts: sql<number>`${passwordResetEmailJobsTable.attempts} + 1`,
        lockedAt: now
      })
      .where(eq(passwordResetEmailJobsTable.id, candidate.id))
      .returning();
    const claimedRow = claimedRows[0];

    if (!claimedRow) {
      throw new Error('Claimed password reset email job was not returned');
    }

    return mapEmailJob(claimedRow);
  });
}

export async function markPasswordResetEmailJobSent(
  job: Pick<PasswordResetEmailJob, 'id' | 'attempts'>,
  sentAt: Date
): Promise<void> {
  await db
    .update(passwordResetEmailJobsTable)
    .set({ sentAt, lockedAt: null, encryptedCode: null })
    .where(
      and(
        eq(passwordResetEmailJobsTable.id, job.id),
        eq(passwordResetEmailJobsTable.attempts, job.attempts)
      )
    );
}

export async function retryPasswordResetEmailJob(
  job: Pick<PasswordResetEmailJob, 'id' | 'attempts'>,
  availableAt: Date
): Promise<void> {
  await db
    .update(passwordResetEmailJobsTable)
    .set({ availableAt, lockedAt: null })
    .where(
      and(
        eq(passwordResetEmailJobsTable.id, job.id),
        eq(passwordResetEmailJobsTable.attempts, job.attempts)
      )
    );
}

export async function markPasswordResetEmailJobFailed(
  job: Pick<PasswordResetEmailJob, 'id' | 'attempts'>,
  failedAt: Date
): Promise<void> {
  await db
    .update(passwordResetEmailJobsTable)
    .set({ failedAt, lockedAt: null, encryptedCode: null })
    .where(
      and(
        eq(passwordResetEmailJobsTable.id, job.id),
        eq(passwordResetEmailJobsTable.attempts, job.attempts)
      )
    );
}

export async function deleteFinishedPasswordResetEmailJobs(
  finishedBefore: Date
): Promise<void> {
  await db
    .delete(passwordResetEmailJobsTable)
    .where(
      or(
        lte(passwordResetEmailJobsTable.sentAt, finishedBefore),
        lte(passwordResetEmailJobsTable.failedAt, finishedBefore)
      )
    );
}
