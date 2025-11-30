import { getCached, setCache } from "@/db/cache";
import { upsertPlayerGameLogs, upsertPlayers } from "@/db/queries";
import type { PlayerGameLogRow, PlayerIndexRow } from "@/lib/validation/nba";
import { normalizePlayerGameLogs, normalizePlayerIndex } from "@/lib/validation/nba";

const PLAYER_INDEX_URL =
  "https://stats.nba.com/stats/playerindex?LeagueId=00&Season=2025-26";

const PLAYER_INDEX_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nba.com/",
  Origin: "https://www.nba.com",
  Connection: "keep-alive",
  Host: "stats.nba.com",
};

// bump key when shape changes so cached payloads refresh
const PLAYER_INDEX_CACHE_KEY = "playerindex:2025-26:v3";
const PLAYER_INDEX_TTL_SECONDS = 60 * 30; // 30 minutes

const PLAYER_GAME_LOG_HEADERS = PLAYER_INDEX_HEADERS;
const PLAYER_GAME_LOG_CACHE_PREFIX = "playergamelog";
const PLAYER_GAME_LOG_TTL_SECONDS = 60 * 15; // 15 minutes per player

type FetchPlayerIndexOptions = {
  /**
   * When true, the freshly-fetched payload is upserted into the `players` table.
   * Only triggers when we hit the NBA API (cache miss), so regular reads avoid
   * spamming the database.
   */
  persistToDb?: boolean;
};

export async function fetchPlayerIndex(
  options: FetchPlayerIndexOptions = {},
): Promise<PlayerIndexRow[]> {
  const { persistToDb = true } = options;
  const cached = await getCached<PlayerIndexRow[]>(PLAYER_INDEX_CACHE_KEY);
  if (cached && !cached.isStale) {
    if (persistToDb) {
      // Backfill DB even when serving from cache so an early cached fetch doesn't
      // skip populating the `players` table.
      await upsertPlayers(cached.payload);
    }
    return cached.payload;
  }

  const response = await fetch(PLAYER_INDEX_URL, {
    headers: PLAYER_INDEX_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PlayerIndex: ${response.status}`);
  }

  const json = await response.json();
  const players = normalizePlayerIndex(json);

  await setCache(PLAYER_INDEX_CACHE_KEY, players, {
    ttlSeconds: PLAYER_INDEX_TTL_SECONDS,
  });

  if (persistToDb) {
    await upsertPlayers(players);
  }

  return players;
}

type FetchPlayerGameLogOptions = {
  season?: string;
  seasonType?: string;
  persistToDb?: boolean;
};

export async function fetchPlayerGameLogs(
  playerId: number,
  { season = "2025-26", seasonType = "Regular Season", persistToDb = true }: FetchPlayerGameLogOptions = {},
): Promise<PlayerGameLogRow[]> {
  const cacheKey = `${PLAYER_GAME_LOG_CACHE_PREFIX}:${playerId}:${season}:${seasonType}`;

  const cached = await getCached<PlayerGameLogRow[]>(cacheKey);
  if (cached && !cached.isStale) {
    if (persistToDb) {
      await upsertPlayerGameLogs(cached.payload);
    }
    return cached.payload;
  }

  const url = new URL("https://stats.nba.com/stats/playergamelog");
  url.searchParams.set("Season", season);
  url.searchParams.set("PlayerId", String(playerId));
  url.searchParams.set("SeasonType", seasonType);

  const response = await fetch(url.toString(), {
    headers: PLAYER_GAME_LOG_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch PlayerGameLog for player ${playerId}: ${response.status}`,
    );
  }

  const json = await response.json();
  const rows = normalizePlayerGameLogs(json);

  await setCache(cacheKey, rows, { ttlSeconds: PLAYER_GAME_LOG_TTL_SECONDS });

  if (persistToDb) {
    await upsertPlayerGameLogs(rows);
  }

  return rows;
}
