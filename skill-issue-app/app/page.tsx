import { unstable_cache } from "next/cache";
import { listPlayers } from "@/db/queries";

export const runtime = "nodejs";

const getPlayers = unstable_cache(
  async () => {
    return listPlayers(10);
  },
  ["players:list"],
  { tags: ["players"], revalidate: 300 },
);

export default async function Home() {
  const players = await getPlayers();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16 md:px-10">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium text-emerald-600">Skill Issue</p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Fantasy basketball scaffolding is ready.
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600">
          Next.js (App Router) with Drizzle ORM on SQLite and Zod validation.
          Data is pulled server-side so you can lean on the React Server
          Component model instead of building another REST layer.
        </p>
      </header>

      <section className="grid gap-6 rounded-2xl border border-zinc-200 bg-white/60 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Players</h2>
            <p className="text-sm text-zinc-600">
              Rendered in a server component via Drizzle + SQLite.
            </p>
          </div>
          <code className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-800">
            cache tag: players
          </code>
        </div>

        {players.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-700">
            No players in the database yet. Use the ingestion script (or import
            from the nba_api responses) and run `pnpm db:push` followed by your
            seed to see results here.
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="text-base font-semibold text-zinc-900">
                    {player.firstName} {player.lastName}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {player.position ?? "Position TBD"} •{" "}
                    {player.teamSlug ?? "Unsigned"}
                  </p>
                </div>
                <code className="text-xs text-zinc-500">#{player.id}</code>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-3 rounded-2xl border border-zinc-200 bg-white/60 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900">Workflow</h3>
        <ol className="list-inside list-decimal text-sm text-zinc-700">
          <li>Copy `.env.example` to `.env` and adjust `DATABASE_URL` if needed.</li>
          <li>Run `pnpm db:push` to sync the schema to SQLite.</li>
          <li>
            Fetch data from `nba_api`, validate with Zod, and upsert via the
            helpers in `db/queries.ts`.
          </li>
          <li>
            Use server components (like this page) to read directly from the DB,
            and trigger cache invalidation via tag revalidation after writes.
          </li>
        </ol>
      </section>
    </main>
  );
}
