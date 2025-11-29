import { and, asc, eq, like, or, sql } from "drizzle-orm";
import { db } from "./client";
import { playerGameLogs, players } from "./schema";
import type { PlayerGameLogRow, PlayerIndexRow } from "@/lib/validation/nba";

export async function listPlayers(limit = 25) {
  return db
    .select()
    .from(players)
    .orderBy(asc(players.lastName), asc(players.firstName))
    .limit(limit);
}

export async function searchPlayersByName(query: string, limit = 50) {
  const value = query.trim();
  if (value.length === 0) {
    return listPlayers(limit);
  }

  const terms = value
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  if (terms.length === 0) {
    return listPlayers(limit);
  }

  // Build AND-of-terms where each term can match first name, last name, or slug.
  const clauses = terms.map((term) => {
    const pattern = `%${term}%`;
    return or(
      like(players.firstName, pattern),
      like(players.lastName, pattern),
      like(players.slug, pattern),
    );
  });

  return db
    .select()
    .from(players)
    .where(and(...clauses))
    .orderBy(asc(players.lastName), asc(players.firstName))
    .limit(limit);
}

type SearchResult = {
  players: Awaited<ReturnType<typeof listPlayers>>;
  total: number;
  page: number;
  pageSize: number;
};

export async function searchPlayersByNamePaged(
  query: string,
  page = 1,
  pageSize = 20,
): Promise<SearchResult> {
  const value = query.trim();
  const terms = value
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  const whereClause =
    terms.length === 0
      ? undefined
      : and(
          ...terms.map((term) => {
            const pattern = `%${term}%`;
            return or(
              like(players.firstName, pattern),
              like(players.lastName, pattern),
              like(players.slug, pattern),
            );
          }),
        );

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(players)
    .where(whereClause);

  const total = Number(count) || 0;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const offset = (safePage - 1) * pageSize;

  const rows = await db
    .select()
    .from(players)
    .where(whereClause)
    .orderBy(asc(players.lastName), asc(players.firstName))
    .limit(pageSize)
    .offset(offset);

  return { players: rows, total, page: safePage, pageSize };
}

export async function getPlayerWithLogs(playerId: number, limit = 200) {
  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);

  if (!player) return null;

  const logs = await db
    .select()
    .from(playerGameLogs)
    .where(eq(playerGameLogs.playerId, playerId))
    .orderBy(sql`${playerGameLogs.gameDate} DESC`)
    .limit(limit);

  return { player, logs };
}

export async function upsertPlayers(rows: PlayerIndexRow[]) {
  if (rows.length === 0) return [];

  return db.transaction((tx) => {
    const ids: number[] = [];

    for (const row of rows) {
      tx
        .insert(players)
        .values({
          id: row.PERSON_ID,
          firstName: row.PLAYER_FIRST_NAME,
          lastName: row.PLAYER_LAST_NAME,
          slug: row.PLAYER_SLUG,
          teamId: row.TEAM_ID ?? undefined,
          teamSlug: row.TEAM_SLUG ?? undefined,
          teamCity: row.TEAM_CITY ?? undefined,
          teamName: row.TEAM_NAME ?? undefined,
          position: row.POSITION ?? undefined,
          jerseyNumber: row.JERSEY_NUMBER ?? undefined,
          rosterStatus: row.ROSTER_STATUS ?? undefined,
          height: row.HEIGHT ?? undefined,
          weight: row.WEIGHT ?? undefined,
          fromYear: row.FROM_YEAR ?? undefined,
          toYear: row.TO_YEAR ?? undefined,
        })
        .onConflictDoUpdate({
          target: players.id,
          set: {
            firstName: row.PLAYER_FIRST_NAME,
            lastName: row.PLAYER_LAST_NAME,
            slug: row.PLAYER_SLUG,
            teamId: row.TEAM_ID ?? undefined,
            teamSlug: row.TEAM_SLUG ?? undefined,
            teamCity: row.TEAM_CITY ?? undefined,
            teamName: row.TEAM_NAME ?? undefined,
            position: row.POSITION ?? undefined,
            jerseyNumber: row.JERSEY_NUMBER ?? undefined,
            rosterStatus: row.ROSTER_STATUS ?? undefined,
            height: row.HEIGHT ?? undefined,
            weight: row.WEIGHT ?? undefined,
            fromYear: row.FROM_YEAR ?? undefined,
            toYear: row.TO_YEAR ?? undefined,
          },
        })
        .run();

      ids.push(row.PERSON_ID);
    }

    return ids;
  });
}

export async function upsertPlayerGameLogs(rows: PlayerGameLogRow[]) {
  if (rows.length === 0) return [];

  return db.transaction((tx) => {
    const ids: number[] = [];

    for (const row of rows) {
      tx
        .insert(playerGameLogs)
        .values({
          playerId: row.PLAYER_ID,
          seasonId: row.SEASON_ID,
          gameId: row.GAME_ID,
          gameDate: row.GAME_DATE,
          matchup: row.MATCHUP,
          result: row.WL ?? undefined,
          minutes: row.MIN ?? undefined,
          fgm: row.FGM ?? undefined,
          fga: row.FGA ?? undefined,
          points: row.PTS ?? undefined,
          rebounds: row.REB ?? undefined,
          oReb: row.OREB ?? undefined,
          dReb: row.DREB ?? undefined,
          assists: row.AST ?? undefined,
          steals: row.STL ?? undefined,
          blocks: row.BLK ?? undefined,
          turnovers: row.TOV ?? undefined,
          personalFouls: row.PF ?? undefined,
          fgPct: row.FG_PCT ?? undefined,
          fg3m: row.FG3M ?? undefined,
          fg3a: row.FG3A ?? undefined,
          ftPct: row.FT_PCT ?? undefined,
          ftm: row.FTM ?? undefined,
          fta: row.FTA ?? undefined,
          threePtPct: row.FG3_PCT ?? undefined,
          plusMinus: row.PLUS_MINUS ?? undefined,
          videoAvailable: row.VIDEO_AVAILABLE ?? undefined,
        })
        .onConflictDoUpdate({
          target: [playerGameLogs.playerId, playerGameLogs.gameId],
          set: {
            seasonId: row.SEASON_ID,
            gameDate: row.GAME_DATE,
            matchup: row.MATCHUP,
            result: row.WL ?? undefined,
            minutes: row.MIN ?? undefined,
            fgm: row.FGM ?? undefined,
            fga: row.FGA ?? undefined,
            points: row.PTS ?? undefined,
            rebounds: row.REB ?? undefined,
            oReb: row.OREB ?? undefined,
            dReb: row.DREB ?? undefined,
            assists: row.AST ?? undefined,
            steals: row.STL ?? undefined,
            blocks: row.BLK ?? undefined,
            turnovers: row.TOV ?? undefined,
            personalFouls: row.PF ?? undefined,
            fgPct: row.FG_PCT ?? undefined,
            fg3m: row.FG3M ?? undefined,
            fg3a: row.FG3A ?? undefined,
            ftPct: row.FT_PCT ?? undefined,
            ftm: row.FTM ?? undefined,
            fta: row.FTA ?? undefined,
            threePtPct: row.FG3_PCT ?? undefined,
            plusMinus: row.PLUS_MINUS ?? undefined,
            videoAvailable: row.VIDEO_AVAILABLE ?? undefined,
          },
        })
        .run();

      ids.push(row.PLAYER_ID);
    }

    return ids;
  });
}

export async function getRecentGameLogs(playerId: number, limit = 10) {
  return db
    .select()
    .from(playerGameLogs)
    .where(eq(playerGameLogs.playerId, playerId))
    .limit(limit);
}
