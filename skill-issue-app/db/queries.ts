import { eq } from "drizzle-orm";
import { db } from "./client";
import { playerGameLogs, players } from "./schema";
import type { PlayerGameLogRow, PlayerIndexRow } from "@/lib/validation/nba";

export async function listPlayers(limit = 25) {
  return db
    .select()
    .from(players)
    .limit(limit);
}

export async function upsertPlayers(rows: PlayerIndexRow[]) {
  if (rows.length === 0) return [];

  return db.transaction(async (tx) => {
    const ids: number[] = [];

    for (const row of rows) {
      const [result] = await tx
        .insert(players)
        .values({
          id: row.PERSON_ID,
          firstName: row.PLAYER_FIRST_NAME,
          lastName: row.PLAYER_LAST_NAME,
          slug: row.PLAYER_SLUG,
          teamId: row.TEAM_ID ?? undefined,
          teamSlug: row.TEAM_SLUG ?? undefined,
          position: row.POSITION ?? undefined,
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
            position: row.POSITION ?? undefined,
            height: row.HEIGHT ?? undefined,
            weight: row.WEIGHT ?? undefined,
            fromYear: row.FROM_YEAR ?? undefined,
            toYear: row.TO_YEAR ?? undefined,
          },
        })
        .$returningId();

      if (result?.id) ids.push(result.id);
    }

    return ids;
  });
}

export async function upsertPlayerGameLogs(rows: PlayerGameLogRow[]) {
  if (rows.length === 0) return [];

  return db.transaction(async (tx) => {
    const ids: number[] = [];

    for (const row of rows) {
      const [result] = await tx
        .insert(playerGameLogs)
        .values({
          playerId: row.PLAYER_ID,
          seasonId: row.SEASON_ID,
          gameId: row.GAME_ID,
          gameDate: row.GAME_DATE,
          matchup: row.MATCHUP,
          result: row.WL ?? undefined,
          minutes: row.MIN ?? undefined,
          points: row.PTS ?? undefined,
          rebounds: row.REB ?? undefined,
          assists: row.AST ?? undefined,
          steals: row.STL ?? undefined,
          blocks: row.BLK ?? undefined,
          turnovers: row.TOV ?? undefined,
          fgPct: row.FG_PCT ?? undefined,
          ftPct: row.FT_PCT ?? undefined,
          threePtPct: row.FG3_PCT ?? undefined,
          plusMinus: row.PLUS_MINUS ?? undefined,
        })
        .onConflictDoUpdate({
          target: [playerGameLogs.playerId, playerGameLogs.gameId],
          set: {
            seasonId: row.SEASON_ID,
            gameDate: row.GAME_DATE,
            matchup: row.MATCHUP,
            result: row.WL ?? undefined,
            minutes: row.MIN ?? undefined,
            points: row.PTS ?? undefined,
            rebounds: row.REB ?? undefined,
            assists: row.AST ?? undefined,
            steals: row.STL ?? undefined,
            blocks: row.BLK ?? undefined,
            turnovers: row.TOV ?? undefined,
            fgPct: row.FG_PCT ?? undefined,
            ftPct: row.FT_PCT ?? undefined,
            threePtPct: row.FG3_PCT ?? undefined,
            plusMinus: row.PLUS_MINUS ?? undefined,
          },
        })
        .$returningId();

      if (result?.id) ids.push(result.id);
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
