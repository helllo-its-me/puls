import { authRateLimitsTable, db } from '@health/db';
import { eq, lte, sql } from 'drizzle-orm';

import type { AuthRateLimitState } from './auth.rate-limit.domain.js';

export async function incrementAuthRateLimit(
  key: string,
  now: Date,
  resetBefore: Date
): Promise<AuthRateLimitState> {
  const resetBeforeIso = resetBefore.toISOString();

  await db
    .delete(authRateLimitsTable)
    .where(lte(authRateLimitsTable.windowStartedAt, resetBefore));

  const rows = await db
    .insert(authRateLimitsTable)
    .values({
      key,
      attempts: 1,
      windowStartedAt: now
    })
    .onConflictDoUpdate({
      target: authRateLimitsTable.key,
      set: {
        attempts: sql<number>`case
          when ${authRateLimitsTable.windowStartedAt} <= ${resetBeforeIso}::timestamptz then 1
          else ${authRateLimitsTable.attempts} + 1
        end`,
        windowStartedAt: sql<Date>`case
          when ${authRateLimitsTable.windowStartedAt} <= ${resetBeforeIso}::timestamptz
            then excluded.window_started_at
          else ${authRateLimitsTable.windowStartedAt}
        end`
      }
    })
    .returning({
      attempts: authRateLimitsTable.attempts,
      windowStartedAt: authRateLimitsTable.windowStartedAt
    });

  const rateLimit = rows[0];

  if (!rateLimit) {
    throw new Error('Auth rate limit state was not returned');
  }

  return rateLimit;
}

export async function clearAuthRateLimit(key: string): Promise<void> {
  await db.delete(authRateLimitsTable).where(eq(authRateLimitsTable.key, key));
}

export async function releaseAuthRateLimit(key: string): Promise<void> {
  await db.transaction(async (tx) => {
    const releasedRows = await tx
      .update(authRateLimitsTable)
      .set({ attempts: sql<number>`${authRateLimitsTable.attempts} - 1` })
      .where(
        sql`${authRateLimitsTable.key} = ${key} and ${authRateLimitsTable.attempts} > 0`
      )
      .returning({ attempts: authRateLimitsTable.attempts });
    const releasedRateLimit = releasedRows[0];

    if (!releasedRateLimit || releasedRateLimit.attempts > 0) {
      return;
    }

    await tx.delete(authRateLimitsTable).where(eq(authRateLimitsTable.key, key));
  });
}
