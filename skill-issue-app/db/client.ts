// import Database from "better-sqlite3";
import BetterSqlite3, { Database } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { env } from "@/env";
import * as schema from "./schema";

const databasePath = env.DB_PATH ?? "./sqlite/db.sql";

declare global {
   
  var __db__: ReturnType<typeof drizzle> | undefined;
   
  var __sqlite__: Database | undefined;
}

const sqlite = global.__sqlite__ ?? new BetterSqlite3(databasePath);

export const db =
  global.__db__ ??
  drizzle(sqlite, {
    schema,
  });

if (process.env.NODE_ENV !== "production") {
  global.__sqlite__ = sqlite;
  global.__db__ = db;
}
