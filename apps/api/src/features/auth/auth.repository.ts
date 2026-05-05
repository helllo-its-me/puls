import { db, profilesTable, refreshSessionsTable, usersTable } from '@health/db';
import { and, eq, gt, isNull } from 'drizzle-orm';

import { initialProfileDefaults } from './auth.defaults.js';
import type {
  ActiveRefreshSession,
  AuthUser,
  CreateRefreshSessionInput,
  CreateUserWithProfileInput,
  UserCredentials
} from './auth.domain.js';

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

export async function createRefreshSession(input: CreateRefreshSessionInput): Promise<void> {
  await db.insert(refreshSessionsTable).values({
    id: input.id,
    userId: input.userId,
    tokenHash: input.tokenHash,
    expiresAt: input.expiresAt,
    createdAt: input.createdAt
  });
}

export async function getActiveRefreshSessionByTokenHash(
  tokenHash: string,
  now: Date
): Promise<ActiveRefreshSession | null> {
  const rows = await db
    .select({
      id: refreshSessionsTable.id,
      userId: refreshSessionsTable.userId,
      email: usersTable.email,
      expiresAt: refreshSessionsTable.expiresAt
    })
    .from(refreshSessionsTable)
    .innerJoin(usersTable, eq(refreshSessionsTable.userId, usersTable.id))
    .where(
      and(
        eq(refreshSessionsTable.tokenHash, tokenHash),
        isNull(refreshSessionsTable.revokedAt),
        gt(refreshSessionsTable.expiresAt, now)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function revokeRefreshSession(id: string, revokedAt: Date): Promise<void> {
  await db
    .update(refreshSessionsTable)
    .set({ revokedAt })
    .where(eq(refreshSessionsTable.id, id));
}
