import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const players = sqliteTable("players", {
  id: integer("id").primaryKey(), // PERSON_ID from API
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  slug: text("slug").notNull(),
  teamId: integer("team_id"),
  teamSlug: text("team_slug"),
  position: text("position"),
  height: text("height"),
  weight: text("weight"),
  fromYear: text("from_year"),
  toYear: text("to_year"),
});

export const playerGameLogs = sqliteTable(
  "player_game_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id),
    seasonId: text("season_id").notNull(),
    gameId: text("game_id").notNull(),
    gameDate: text("game_date").notNull(),
    matchup: text("matchup").notNull(),
    result: text("result"),
    minutes: integer("minutes"),
    points: integer("points"),
    rebounds: integer("rebounds"),
    assists: integer("assists"),
    steals: integer("steals"),
    blocks: integer("blocks"),
    turnovers: integer("turnovers"),
    fgPct: real("fg_pct"),
    ftPct: real("ft_pct"),
    threePtPct: real("three_pt_pct"),
    plusMinus: integer("plus_minus"),
    createdAt: integer("created_at").default(sql`(unixepoch())`),
  },
  (table) => ({
    uniqueGame: uniqueIndex("player_game_unique").on(table.playerId, table.gameId),
  }),
);
