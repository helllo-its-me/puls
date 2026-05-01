import { db, profilesTable, usersTable } from '@health/db';
import { eq } from 'drizzle-orm';

import { initialProfileDefaults } from './auth.defaults.js';
import type { AuthUser, CreateUserWithProfileInput, UserCredentials } from './auth.domain.js';

export async function getUserCredentialsByEmail(email: string): Promise<UserCredentials | null> {
  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      passwordHash: usersTable.passwordHash
    })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  return rows[0] ?? null;
}

export async function createUserWithProfile(input: CreateUserWithProfileInput): Promise<AuthUser> {
  await db.transaction(async (tx) => {
    await tx.insert(usersTable).values({
      id: input.userId,
      email: input.email,
      passwordHash: input.passwordHash,
      createdAt: input.createdAt
    });

    await tx.insert(profilesTable).values({
      id: input.profileId,
      userId: input.userId,
      firstName: input.firstName,
      lastName: input.lastName,
      membershipTier: initialProfileDefaults.membershipTier,
      planTitle: initialProfileDefaults.planTitle,
      joinedAt: input.createdAt,
      nextSessionAt: input.createdAt,
      streakDays: initialProfileDefaults.streakDays,
      completionPercent: initialProfileDefaults.completionPercent,
      energyLabel: initialProfileDefaults.energyLabel,
      consistencyNote: initialProfileDefaults.consistencyNote,
      supportNote: initialProfileDefaults.supportNote
    });
  });

  return {
    id: input.userId,
    email: input.email
  };
}
