import { getPlayerWithLogs } from "@/db/queries";
import { fetchPlayerGameLogs, fetchPlayerIndex } from "@/lib/nba-api";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = {
  params:
    | { id: string | string[] }
    | Promise<{ id: string | string[] }>
    | undefined;
};

export const runtime = "nodejs";

export default async function PlayerPage({ params }: PageProps) {
  const resolvedParams =
    params && typeof (params as Promise<unknown>).then === "function"
      ? await (params as Promise<{ id: string | string[] }>)
      : (params as { id: string | string[] } | undefined);

  const rawId = Array.isArray(resolvedParams?.id)
    ? resolvedParams?.id[0]
    : resolvedParams?.id;

  const parsedId = rawId ? Number(rawId) : NaN;
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    notFound();
  }
  const playerId = parsedId;

  // Ensure base player data exists in SQLite.
  await fetchPlayerIndex();
  // Fetch + cache + upsert game logs for this player.
  await fetchPlayerGameLogs(playerId);

  const data = await getPlayerWithLogs(playerId, 400);
  if (!data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12 md:px-10">
        <Link href="/browse" className="text-sm text-emerald-700 hover:underline">
          ← Back to browse
        </Link>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
          Player not found.
        </div>
      </main>
    );
  }

  const { player, logs } = data;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12 md:px-10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Link href="/browse" className="text-sm text-emerald-700 hover:underline">
            ← Back to browse
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            {player.firstName} {player.lastName}
          </h1>
          <p className="text-sm text-zinc-600">
            {player.teamCity && player.teamName
              ? `${player.teamCity} ${player.teamName}`
              : player.teamName ?? "Team unknown"}
            {player.position ? ` · ${player.position}` : ""}
            {player.jerseyNumber ? ` · #${player.jerseyNumber}` : ""}
          </p>
        </div>
        <code className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-800">
          cached via web_cache + SQLite
        </code>
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Game Logs</h2>
            <p className="text-sm text-zinc-600">Most recent games, cached per player.</p>
          </div>
          <div className="text-xs text-zinc-600">{logs.length} games</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Date</th>
                <th className="px-4 py-3 whitespace-nowrap">Matchup</th>
                <th className="px-4 py-3">W/L</th>
                <th className="px-4 py-3">Min</th>
                <th className="px-4 py-3">Pts</th>
                <th className="px-4 py-3">FGM</th>
                <th className="px-4 py-3">FGA</th>
                <th className="px-4 py-3">FG%</th>
                <th className="px-4 py-3">3PM</th>
                <th className="px-4 py-3">3PA</th>
                <th className="px-4 py-3">3P%</th>
                <th className="px-4 py-3">FTM</th>
                <th className="px-4 py-3">FTA</th>
                <th className="px-4 py-3">FT%</th>
                <th className="px-4 py-3">OREB</th>
                <th className="px-4 py-3">DREB</th>
                <th className="px-4 py-3">REB</th>
                <th className="px-4 py-3">AST</th>
                <th className="px-4 py-3">STL</th>
                <th className="px-4 py-3">BLK</th>
                <th className="px-4 py-3">TOV</th>
                <th className="px-4 py-3">PF</th>
                <th className="px-4 py-3">+/-</th>
                <th className="px-4 py-3">Video</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {logs.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-zinc-600" colSpan={24}>
                    No game logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.gameId} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-800 whitespace-nowrap">{log.gameDate}</td>
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">{log.matchup}</td>
                    <td className="px-4 py-3 text-zinc-700">{log.result ?? "—"}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.minutes)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.points)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.fgm)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.fga)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderPct(log.fgPct)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.fg3m)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.fg3a)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderPct(log.threePtPct)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.ftm)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.fta)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderPct(log.ftPct)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.oReb)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.dReb)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.rebounds)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.assists)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.steals)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.blocks)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.turnovers)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.personalFouls)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.plusMinus)}</td>
                    <td className="px-4 py-3 text-zinc-700">{renderNumber(log.videoAvailable)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function renderNumber(value: number | null | undefined) {
  return value ?? "—";
}

function renderPct(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(1)}%`;
}
