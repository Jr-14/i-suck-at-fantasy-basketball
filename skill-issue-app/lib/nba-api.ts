import { getCached, setCache } from "@/db/cache";
import type { PlayerIndexRow } from "@/lib/validation/nba";
import { normalizePlayerIndex } from "@/lib/validation/nba";

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
const PLAYER_INDEX_CACHE_KEY = "playerindex:2025-26:v2";
const PLAYER_INDEX_TTL_SECONDS = 60 * 60 * 6; // 6 hours

export async function fetchPlayerIndex(): Promise<PlayerIndexRow[]> {
  const cached = await getCached<PlayerIndexRow[]>(PLAYER_INDEX_CACHE_KEY);
  if (cached && !cached.isStale) {
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

  return players;
}
