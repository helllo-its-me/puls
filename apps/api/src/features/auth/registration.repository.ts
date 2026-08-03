import {
  db,
  passwordResetEmailJobsTable,
  profilesTable,
  registrationAttemptsTable,
  usersTable
} from '@health/db';
import { and, eq, gt, isNotNull, isNull, lte, or, sql } from 'drizzle-orm';

import { initialProfileDefaults } from './auth.defaults.js';
import { emailVerificationCodeEmailJobKind } from './password-reset-email-job.domain.js';
import type {
  CreateRegistrationAttemptInput,
  RegistrationAttempt
} from './registration.domain.js';

function createInitialProfileValues(
  attempt: typeof registrationAttemptsTable.$inferSelect,
  userId: string
) {
  return {
    id: attempt.profileId,
    userId,
    firstName: attempt.firstName,
    lastName: attempt.lastName,
    membershipTier: initialProfileDefaults.membershipTier,
    planTitle: initialProfileDefaults.planTitle,
    joinedAt: attempt.createdAt,
    nextSessionAt: attempt.createdAt,
    streakDays: initialProfileDefaults.streakDays,
    completionPercent: initialProfileDefaults.completionPercent,
    energyLabel: initialProfileDefaults.energyLabel,
    consistencyNote: initialProfileDefaults.consistencyNote,
    supportNote: initialProfileDefaults.supportNote
  };
}

export async function createRegistrationAttempt(
  input: CreateRegistrationAttemptInput
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${input.email}, 0))`
    );
    await tx
      .delete(registrationAttemptsTable)
      .where(or(
        isNotNull(registrationAttemptsTable.usedAt),
        lte(registrationAttemptsTable.expiresAt, input.createdAt)
      ));

    const existingUsers = await tx
      .select({ emailVerifiedAt: usersTable.emailVerifiedAt })
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1)
      .for('update');

    if (existingUsers[0]?.emailVerifiedAt) {
      return;
    }

    await tx
      .delete(registrationAttemptsTable)
      .where(eq(registrationAttemptsTable.email, input.email));

    await tx.insert(registrationAttemptsTable).values({
      id: input.id,
      registrationTokenHash: input.registrationTokenHash,
      userId: input.userId,
      profileId: input.profileId,
      email: input.email,
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      codeHash: input.codeHash,
      encryptedCode: input.encryptedCode,
      expiresAt: input.codeExpiresAt,
      createdAt: input.createdAt
    });
    await tx.insert(passwordResetEmailJobsTable).values({
      id: input.emailJobId,
      kind: emailVerificationCodeEmailJobKind,
      email: input.email,
      encryptedCode: input.encryptedCode,
      codeExpiresAt: input.codeExpiresAt,
      availableAt: input.createdAt,
      createdAt: input.createdAt
    });
  });
}

export async function getActiveRegistrationAttempt(
  email: string,
  registrationTokenHash: string,
  now: Date
): Promise<RegistrationAttempt | null> {
  const rows = await db
    .select({
      id: registrationAttemptsTable.id,
      email: registrationAttemptsTable.email,
      codeHash: registrationAttemptsTable.codeHash,
      expiresAt: registrationAttemptsTable.expiresAt
    })
    .from(registrationAttemptsTable)
    .where(and(
      eq(registrationAttemptsTable.email, email),
      eq(registrationAttemptsTable.registrationTokenHash, registrationTokenHash),
      isNull(registrationAttemptsTable.usedAt),
      gt(registrationAttemptsTable.expiresAt, now)
    ))
    .limit(1);

  return rows[0] ?? null;
}

export async function verifyRegistrationAttempt(
  attemptId: string,
  email: string,
  verifiedAt: Date
): Promise<boolean> {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${email}, 0))`
    );
    const claimedAttempts = await tx
      .update(registrationAttemptsTable)
      .set({ usedAt: verifiedAt })
      .where(and(
        eq(registrationAttemptsTable.id, attemptId),
        eq(registrationAttemptsTable.email, email),
        isNull(registrationAttemptsTable.usedAt),
        gt(registrationAttemptsTable.expiresAt, verifiedAt)
      ))
      .returning();
    const attempt = claimedAttempts[0];

    if (!attempt) {
      return false;
    }

    const existingUsers = await tx
      .select({
        id: usersTable.id,
        emailVerifiedAt: usersTable.emailVerifiedAt
      })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1)
      .for('update');
    const existingUser = existingUsers[0];

    if (existingUser?.emailVerifiedAt) {
      await tx
        .delete(registrationAttemptsTable)
        .where(eq(registrationAttemptsTable.email, email));
      return false;
    }

    const userId = existingUser?.id ?? attempt.userId;

    if (existingUser) {
      await tx
        .update(usersTable)
        .set({
          passwordHash: attempt.passwordHash,
          emailVerifiedAt: verifiedAt
        })
        .where(eq(usersTable.id, userId));
      const updatedProfiles = await tx
        .update(profilesTable)
        .set({
          firstName: attempt.firstName,
          lastName: attempt.lastName
        })
        .where(eq(profilesTable.userId, userId))
        .returning({ id: profilesTable.id });

      if (!updatedProfiles[0]) {
        await tx.insert(profilesTable).values(
          createInitialProfileValues(attempt, userId)
        );
      }
    } else {
      await tx.insert(usersTable).values({
        id: userId,
        email,
        passwordHash: attempt.passwordHash,
        emailVerifiedAt: verifiedAt,
        createdAt: attempt.createdAt
      });
      await tx.insert(profilesTable).values(
        createInitialProfileValues(attempt, userId)
      );
    }

    await tx
      .delete(registrationAttemptsTable)
      .where(eq(registrationAttemptsTable.email, email));

    return true;
  });
}
