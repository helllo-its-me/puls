import {
  db,
  refreshSessionFamiliesTable,
  refreshSessionsTable,
  usersTable
} from '@health/db';
import { and, eq, isNotNull, isNull, lte } from 'drizzle-orm';
import type {
  AuthSessionUser,
  AuthUser,
  CreateRefreshSessionInput,
  UserCredentials
} from './auth.domain.js';

export async function getUserCredentialsByEmail(email: string): Promise<UserCredentials | null> {
  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      passwordHash: usersTable.passwordHash,
      authVersion: usersTable.authVersion
    })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.email, email),
        isNotNull(usersTable.emailVerifiedAt)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getUserByIdAndAuthVersion(
  id: string,
  authVersion: number
): Promise<AuthUser | null> {
  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email
    })
    .from(usersTable)
    .where(and(
      eq(usersTable.id, id),
      eq(usersTable.authVersion, authVersion),
      isNotNull(usersTable.emailVerifiedAt)
    ))
    .limit(1);

  return rows[0] ?? null;
}

export async function updateUserPasswordHashIfCurrent(
  userId: string,
  currentPasswordHash: string,
  nextPasswordHash: string
): Promise<void> {
  await db
    .update(usersTable)
    .set({ passwordHash: nextPasswordHash })
    .where(
      and(
        eq(usersTable.id, userId),
        eq(usersTable.passwordHash, currentPasswordHash)
      )
    );
}

export async function createRefreshSession(input: CreateRefreshSessionInput): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .delete(refreshSessionFamiliesTable)
      .where(lte(refreshSessionFamiliesTable.expiresAt, input.createdAt));
    await tx
      .delete(refreshSessionsTable)
      .where(lte(refreshSessionsTable.expiresAt, input.createdAt));

    await tx.insert(refreshSessionFamiliesTable).values({
      id: input.familyId,
      userId: input.userId,
      expiresAt: input.expiresAt,
      createdAt: input.createdAt
    });

    await tx.insert(refreshSessionsTable).values({
      id: input.id,
      userId: input.userId,
      familyId: input.familyId,
      authVersion: input.authVersion,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      createdAt: input.createdAt
    });
  });
}

export async function rotateRefreshSession(
  currentTokenHash: string,
  nextSession: Omit<CreateRefreshSessionInput, 'familyId' | 'userId' | 'authVersion'>,
  now: Date
): Promise<AuthSessionUser | null> {
  return db.transaction(async (tx) => {
    await tx
      .delete(refreshSessionFamiliesTable)
      .where(lte(refreshSessionFamiliesTable.expiresAt, now));
    await tx
      .delete(refreshSessionsTable)
      .where(lte(refreshSessionsTable.expiresAt, now));

    const sessionReferences = await tx
      .select({ familyId: refreshSessionsTable.familyId })
      .from(refreshSessionsTable)
      .where(eq(refreshSessionsTable.tokenHash, currentTokenHash))
      .limit(1);
    const sessionReference = sessionReferences[0];

    if (!sessionReference) {
      return null;
    }

    const families = await tx
      .select({ revokedAt: refreshSessionFamiliesTable.revokedAt })
      .from(refreshSessionFamiliesTable)
      .where(eq(refreshSessionFamiliesTable.id, sessionReference.familyId))
      .limit(1)
      .for('update');
    const family = families[0];

    if (!family || family.revokedAt) {
      return null;
    }

    const sessions = await tx
      .select({
        id: refreshSessionsTable.id,
        familyId: refreshSessionsTable.familyId,
        userId: refreshSessionsTable.userId,
        authVersion: refreshSessionsTable.authVersion,
        expiresAt: refreshSessionsTable.expiresAt,
        revokedAt: refreshSessionsTable.revokedAt
      })
      .from(refreshSessionsTable)
      .where(eq(refreshSessionsTable.tokenHash, currentTokenHash))
      .limit(1)
      .for('update');
    const currentSession = sessions[0];

    if (!currentSession) {
      return null;
    }

    if (currentSession.revokedAt) {
      await tx
        .update(refreshSessionFamiliesTable)
        .set({ revokedAt: now })
        .where(eq(refreshSessionFamiliesTable.id, currentSession.familyId));
      await tx
        .update(refreshSessionsTable)
        .set({ revokedAt: now })
        .where(
          and(
            eq(refreshSessionsTable.familyId, currentSession.familyId),
            isNull(refreshSessionsTable.revokedAt)
          )
        );

      return null;
    }

    if (currentSession.expiresAt <= now) {
      return null;
    }

    await tx
      .update(refreshSessionsTable)
      .set({ revokedAt: now })
      .where(eq(refreshSessionsTable.id, currentSession.id));

    const users = await tx
      .select({
        id: usersTable.id,
        email: usersTable.email,
        authVersion: usersTable.authVersion
      })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.id, currentSession.userId),
          eq(usersTable.authVersion, currentSession.authVersion)
        )
      )
      .limit(1);
    const user = users[0];

    if (!user) {
      return null;
    }

    await tx.insert(refreshSessionsTable).values({
      ...nextSession,
      userId: user.id,
      familyId: currentSession.familyId,
      authVersion: currentSession.authVersion
    });
    await tx
      .update(refreshSessionFamiliesTable)
      .set({ expiresAt: nextSession.expiresAt })
      .where(eq(refreshSessionFamiliesTable.id, currentSession.familyId));

    return user;
  });
}

export async function revokeRefreshSessionFamilyByTokenHash(
  tokenHash: string,
  revokedAt: Date
): Promise<void> {
  await db.transaction(async (tx) => {
    const sessions = await tx
      .select({ familyId: refreshSessionsTable.familyId })
      .from(refreshSessionsTable)
      .where(eq(refreshSessionsTable.tokenHash, tokenHash))
      .limit(1);
    const session = sessions[0];

    if (!session) {
      return;
    }

    const families = await tx
      .select({ id: refreshSessionFamiliesTable.id })
      .from(refreshSessionFamiliesTable)
      .where(eq(refreshSessionFamiliesTable.id, session.familyId))
      .limit(1)
      .for('update');

    if (!families[0]) {
      return;
    }

    await tx
      .update(refreshSessionFamiliesTable)
      .set({ revokedAt })
      .where(eq(refreshSessionFamiliesTable.id, session.familyId));

    await tx
      .update(refreshSessionsTable)
      .set({ revokedAt })
      .where(
        and(
          eq(refreshSessionsTable.familyId, session.familyId),
          isNull(refreshSessionsTable.revokedAt)
        )
      );
  });
}
