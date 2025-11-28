import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env" });

const dbPath = process.env.DB_PATH ?? "./sqlite/db.sqlite";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
  verbose: true,
});
