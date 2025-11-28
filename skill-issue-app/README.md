This is a Next.js (App Router) project using Drizzle ORM with SQLite, and Zod for validation. Below is the minimal setup to run the app locally and populate the DB.

## Prerequisites
- Node.js 18+
- pnpm (recommended) or npm/yarn

## Environment
Copy the example env and adjust if needed:
```bash
cp .env.example .env
```
Defaults:
- `DB_PATH=./sqlite/db.sqlite` — SQLite database file (relative to repo root)

## Install deps
```bash
pnpm install
```
If `better-sqlite3` needs to rebuild, ensure you have a C/C++ toolchain (Python 3, make, gcc/clang).

## Create/upgrade the database
```bash
pnpm db:push
```
This syncs Drizzle schema to the SQLite file at `DB_PATH`. You can inspect data with:
```bash
pnpm db:studio
```

## Seed / ingest data
- Ingest NBA API responses, validate with Zod (see `lib/validation/nba.ts`), then upsert via `db/queries.ts`.
- Example flow:
  1) Fetch from `nba_api`
  2) Normalize with `normalizePlayerIndex`/`normalizePlayerGameLogs`
  3) `await upsertPlayers(...)` / `await upsertPlayerGameLogs(...)`
  4) Call `revalidateTag("players")` after writes to refresh server-component caches

## Run the app
```bash
pnpm dev
```
Visit http://localhost:3000. The home page reads from SQLite in a server component and shows players if present.

## Caching helper (optional)
- A simple TTL cache lives in `db/web_cache` with helpers in `db/cache.ts`:
  - `getCached(key)` returns cached payload if fresh (or stale within optional stale window).
  - `setCache(key, payload, { ttlSeconds, staleAfterSeconds?, status? })` upserts.
  - `pruneExpired()` deletes expired rows.

## Scripts
- `pnpm dev` — run Next.js dev server
- `pnpm db:push` — sync schema to SQLite
- `pnpm db:studio` — open Drizzle Studio
- `pnpm lint` — run lint
