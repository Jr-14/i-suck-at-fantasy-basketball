import { z } from "zod";

const playerIndexRow = z.object({
  PERSON_ID: z.coerce.number(),
  PLAYER_LAST_NAME: z.string(),
  PLAYER_FIRST_NAME: z.string(),
  PLAYER_SLUG: z.string(),
  TEAM_ID: z.coerce.number().nullable(),
  TEAM_SLUG: z.string().nullable(),
  POSITION: z.string().nullable(),
  HEIGHT: z.string().nullable(),
  WEIGHT: z.string().nullable(),
  FROM_YEAR: z.string().nullable(),
  TO_YEAR: z.string().nullable(),
});

export const playerIndexResponse = z.object({
  resultSets: z.array(
    z.object({
      name: z.literal("PlayerIndex"),
      headers: z.array(z.string()),
      rowSet: z.array(z.array(z.unknown())),
    }),
  ),
});

export type PlayerIndexRow = z.infer<typeof playerIndexRow>;

const playerGameLogRow = z.object({
  SEASON_ID: z.string(),
  PLAYER_ID: z.coerce.number(),
  GAME_ID: z.string(),
  GAME_DATE: z.string(),
  MATCHUP: z.string(),
  WL: z.string().nullable(),
  MIN: z.coerce.number().nullable(),
  PTS: z.coerce.number().nullable(),
  REB: z.coerce.number().nullable(),
  AST: z.coerce.number().nullable(),
  STL: z.coerce.number().nullable(),
  BLK: z.coerce.number().nullable(),
  TOV: z.coerce.number().nullable(),
  FG_PCT: z.coerce.number().nullable(),
  FT_PCT: z.coerce.number().nullable(),
  FG3_PCT: z.coerce.number().nullable(),
  PLUS_MINUS: z.coerce.number().nullable(),
});

export const playerGameLogResponse = z.object({
  resultSets: z.array(
    z.object({
      name: z.literal("PlayerGameLog"),
      headers: z.array(z.string()),
      rowSet: z.array(z.array(z.unknown())),
    }),
  ),
});

export type PlayerGameLogRow = z.infer<typeof playerGameLogRow>;

function materializeRows<T extends z.ZodTypeAny>(
  headers: string[],
  rows: unknown[][],
  schema: T,
) {
  const normalizedHeaders = headers.map((header) => header.toUpperCase());

  return rows
    .map((row) =>
      schema.safeParse(
        Object.fromEntries(
          normalizedHeaders.map((header, index) => [header, row[index]]),
        ),
      ),
    )
    .filter((result) => result.success)
    .map((result) => (result as Extract<typeof result, { success: true }>).data);
}

export function normalizePlayerIndex(payload: unknown): PlayerIndexRow[] {
  const parsed = playerIndexResponse.parse(payload);
  const set = parsed.resultSets.find((item) => item.name === "PlayerIndex");
  if (!set) return [];
  return materializeRows(set.headers, set.rowSet, playerIndexRow);
}

export function normalizePlayerGameLogs(payload: unknown): PlayerGameLogRow[] {
  const parsed = playerGameLogResponse.parse(payload);
  const set = parsed.resultSets.find((item) => item.name === "PlayerGameLog");
  if (!set) return [];
  return materializeRows(set.headers, set.rowSet, playerGameLogRow);
}
