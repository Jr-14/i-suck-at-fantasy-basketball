import { and, asc, eq, like, or, sql } from "drizzle-orm";
import { db } from "./client";
import {
  lineupPlayers,
  lineups,
  playerGameLogs,
  players,
  SelectPlayerGameLog,
  type SelectLineup,
  type SelectLineupPlayer,
  type SelectPlayer,
} from "./schema";
import type { PlayerGameLogRow, PlayerIndexRow } from "@/lib/validation/nba";

export async function listPlayers(
  limit = 25
): Promise<SelectPlayer[]> {
  return await db
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

  return await db
    .select()
    .from(players)
    .where(and(...clauses))
    .orderBy(asc(players.lastName), asc(players.firstName))
    .limit(limit);
}

interface SearchResult {
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

interface PlayerWithLogs {
  player: SelectPlayer;
  logs: SelectPlayerGameLog[]
}

export async function getPlayerWithLogs(
  playerId: number, limit = 200
): Promise<PlayerWithLogs | null> {
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

  return await db.transaction((tx) => {
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
          points: row.PTS ?? undefined,
          rebounds: row.REB ?? undefined,
          assists: row.AST ?? undefined,
          statsTimeframe: row.STATS_TIMEFRAME ?? undefined,
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
            points: row.PTS ?? undefined,
            rebounds: row.REB ?? undefined,
            assists: row.AST ?? undefined,
            statsTimeframe: row.STATS_TIMEFRAME ?? undefined,
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

export async function listLineups(): Promise<SelectLineup[]> {
  return db.select().from(lineups).orderBy(asc(lineups.createdAt));
}

export async function getLineup(lineupId: number): Promise<SelectLineup | null> {
  const [row] = await db.select().from(lineups).where(eq(lineups.id, lineupId)).limit(1);
  return row ?? null;
}

export async function createLineup(name: string): Promise<SelectLineup> {
  const trimmed = name.trim();
  const value = trimmed.length === 0 ? "My lineup" : trimmed;

  const existing = await db
    .select()
    .from(lineups)
    .where(eq(lineups.name, value))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const [created] = await db
    .insert(lineups)
    .values({ name: value })
    .returning();

  return created;
}

export async function listLineupIds(lineupId: number): Promise<number[]> {
  const rows = await db
    .select({ playerId: lineupPlayers.playerId })
    .from(lineupPlayers)
    .where(eq(lineupPlayers.lineupId, lineupId));
  return rows.map((row) => row.playerId);
}

export async function addPlayerToLineup(lineupId: number, playerId: number) {
  await db
    .insert(lineupPlayers)
    .values({ lineupId, playerId })
    .onConflictDoNothing({ target: [lineupPlayers.lineupId, lineupPlayers.playerId] });
}

export async function removePlayerFromLineup(lineupId: number, playerId: number) {
  await db
    .delete(lineupPlayers)
    .where(and(eq(lineupPlayers.lineupId, lineupId), eq(lineupPlayers.playerId, playerId)));
}

export async function updateLineupPlayerPositions(
  lineupPlayerId: number,
  positions: string[] | null,
) {
  await db
    .update(lineupPlayers)
    .set({ customPositions: positions })
    .where(eq(lineupPlayers.id, lineupPlayerId));
}

export type LineupEntryWithStats = {
  lineupPlayer: SelectLineupPlayer;
  lineup: SelectLineup;
  player: SelectPlayer;
  stats: {
    games: number;
    fgPct: number | null;
    ftPct: number | null;
    threePtMade: number | null;
    points: number | null;
    rebounds: number | null;
    assists: number | null;
    steals: number | null;
    blocks: number | null;
    turnovers: number | null;
  };
};

export async function listLineupWithStats(lineupId: number): Promise<LineupEntryWithStats[]> {
  const rows = await db
    .select({
      lineupPlayer: lineupPlayers,
      lineup: lineups,
      player: players,
      games: sql<number>`count(${playerGameLogs.id})`,
      fgPct: sql<number | null>`avg(${playerGameLogs.fgPct})`,
      ftPct: sql<number | null>`avg(${playerGameLogs.ftPct})`,
      threePtMade: sql<number | null>`avg(${playerGameLogs.fg3m})`,
      points: sql<number | null>`avg(${playerGameLogs.points})`,
      rebounds: sql<number | null>`avg(${playerGameLogs.rebounds})`,
      assists: sql<number | null>`avg(${playerGameLogs.assists})`,
      steals: sql<number | null>`avg(${playerGameLogs.steals})`,
      blocks: sql<number | null>`avg(${playerGameLogs.blocks})`,
      turnovers: sql<number | null>`avg(${playerGameLogs.turnovers})`,
    })
    .from(lineupPlayers)
    .innerJoin(players, eq(lineupPlayers.playerId, players.id))
    .innerJoin(lineups, eq(lineupPlayers.lineupId, lineups.id))
    .leftJoin(playerGameLogs, eq(playerGameLogs.playerId, players.id))
    .where(eq(lineupPlayers.lineupId, lineupId))
    .groupBy(lineupPlayers.id, players.id, lineups.id)
    .orderBy(asc(lineupPlayers.createdAt));

  return rows.map((row) => ({
    lineupPlayer: row.lineupPlayer,
    lineup: row.lineup,
    player: row.player,
    stats: {
      games: Number(row.games) || 0,
      fgPct: row.fgPct,
      ftPct: row.ftPct,
      threePtMade: row.threePtMade,
      points: row.points,
      rebounds: row.rebounds,
      assists: row.assists,
      steals: row.steals,
      blocks: row.blocks,
      turnovers: row.turnovers,
    },
  }));
}

export async function lineupSummaries() {
  return db
    .select({
      lineup: lineups,
      games: sql<number>`count(${playerGameLogs.id})`,
      fgPct: sql<number | null>`avg(${playerGameLogs.fgPct})`,
      ftPct: sql<number | null>`avg(${playerGameLogs.ftPct})`,
      threePtMade: sql<number | null>`avg(${playerGameLogs.fg3m})`,
      points: sql<number | null>`avg(${playerGameLogs.points})`,
      rebounds: sql<number | null>`avg(${playerGameLogs.rebounds})`,
      assists: sql<number | null>`avg(${playerGameLogs.assists})`,
      steals: sql<number | null>`avg(${playerGameLogs.steals})`,
      blocks: sql<number | null>`avg(${playerGameLogs.blocks})`,
      turnovers: sql<number | null>`avg(${playerGameLogs.turnovers})`,
    })
    .from(lineups)
    .leftJoin(lineupPlayers, eq(lineupPlayers.lineupId, lineups.id))
    .leftJoin(players, eq(lineupPlayers.playerId, players.id))
    .leftJoin(playerGameLogs, eq(playerGameLogs.playerId, players.id))
    .groupBy(lineups.id)
    .orderBy(asc(lineups.createdAt));
}
