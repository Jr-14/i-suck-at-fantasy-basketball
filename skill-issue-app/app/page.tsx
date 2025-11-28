import { unstable_cache } from "next/cache";
import { fetchPlayerIndex } from "@/lib/nba-api";

export const runtime = "nodejs";

const getPlayerIndex = unstable_cache(
  async () => {
    return fetchPlayerIndex();
  },
  ["playerindex:2025-26"],
  { revalidate: false }, // caching handled by SQLite TTL cache
);

export default async function Home() {
  const players = await getPlayerIndex();
  const topPlayers = players.slice(0, 5);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16 md:px-10">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium text-emerald-600">Skill Issue</p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          NBA Player Index (top 5)
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600">
          Fetched from stats.nba.com with required headers and cached via
          SQLite-backed TTL cache. Showing the first 5 rows for brevity.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Players</h2>
            <p className="text-sm text-zinc-600">
              Showing the first 5 rows from the PlayerIndex endpoint.
            </p>
          </div>
          <code className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-800">
            cached via SQLite TTL
          </code>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Person ID</th>
                <th className="px-4 py-3">First Name</th>
                <th className="px-4 py-3">Last Name</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Jersey</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Height</th>
                <th className="px-4 py-3">Roster Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {topPlayers.map((player) => (
                <tr key={player.PERSON_ID} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                    {player.PERSON_ID}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {player.PLAYER_FIRST_NAME}
                  </td>
                  <td className="px-4 py-3 text-zinc-900">
                    {player.PLAYER_LAST_NAME}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {player.TEAM_CITY && player.TEAM_NAME
                      ? `${player.TEAM_CITY} ${player.TEAM_NAME}`
                      : player.TEAM_NAME ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {player.JERSEY_NUMBER ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {player.POSITION ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {player.HEIGHT ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {player.ROSTER_STATUS === 1
                      ? "ROSTERED"
                      : player.ROSTER_STATUS === 0
                        ? "NOT_ROSTERED"
                        : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
