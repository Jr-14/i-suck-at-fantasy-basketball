import { and, eq, gt, lte, sql } from "drizzle-orm";
import { db } from "./client";
import { webCache } from "./schema";

type CacheEntry<T> = {
  payload: T;
  status: number;
  isStale: boolean;
};

type SetOptions = {
  ttlSeconds: number;
  staleAfterSeconds?: number;
  status?: number;
};

export async function getCached<T = unknown>(
  key: string,
): Promise<CacheEntry<T> | null> {
  const now = Math.floor(Date.now() / 1000);

  const [row] = await db
    .select()
    .from(webCache)
    .where(
      and(
        eq(webCache.key, key),
        // Allow stale-while-revalidate: row is valid if within ttl or stale window.
        gt(
          sql`${webCache.fetchedAt} + COALESCE(${webCache.staleAfterSeconds}, ${webCache.ttlSeconds})`,
          now,
        ),
      ),
    )
    .limit(1);

  if (!row) return null;

  const expiresAt = row.fetchedAt + row.ttlSeconds;
  const isStale = expiresAt <= now;

  try {
    const payload = JSON.parse(row.payload) as T;
    return { payload, status: row.status ?? 200, isStale };
  } catch (error) {
    // If payload is corrupted, treat as cache miss.
    return null;
  }
}

export async function setCache(
  key: string,
  payload: unknown,
  { ttlSeconds, staleAfterSeconds, status = 200 }: SetOptions,
) {
  const now = Math.floor(Date.now() / 1000);

  return db
    .insert(webCache)
    .values({
      key,
      payload: JSON.stringify(payload),
      status,
      fetchedAt: now,
      ttlSeconds,
      staleAfterSeconds,
    })
    .onConflictDoUpdate({
      target: webCache.key,
      set: {
        payload: sql`excluded.payload`,
        status: sql`excluded.status`,
        fetchedAt: sql`excluded.fetched_at`,
        ttlSeconds: sql`excluded.ttl_seconds`,
        staleAfterSeconds: sql`excluded.stale_after_seconds`,
      },
    });
}

export async function pruneExpired() {
  const now = Math.floor(Date.now() / 1000);
  return db
    .delete(webCache)
    .where(lte(sql`${webCache.fetchedAt} + ${webCache.ttlSeconds}`, now));
}
