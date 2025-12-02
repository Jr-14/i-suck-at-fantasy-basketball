import {
  createLineupAndRedirectAction,
  removePlayerFromLineupAction,
} from "@/app/actions/lineup";
import { getLineup, listLineupWithStats, listLineups } from "@/db/queries";
import { summarizeLineup } from "@/lib/lineup";
import Link from "next/link";

export const runtime = "nodejs";

type PageProps = {
  searchParams?:
    | { lineupId?: string | string[] }
    | Promise<{ lineupId?: string | string[] }>
    | undefined;
};

export default async function LineupPage({ searchParams }: PageProps) {
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<unknown>).then === "function"
      ? await (searchParams as Promise<{ lineupId?: string | string[] }>)
      : (searchParams as { lineupId?: string | string[] } | undefined);

  const allLineups = await listLineups();
  const requestedLineupId = parseLineupId(resolvedSearchParams?.lineupId);
  const defaultLineupId = requestedLineupId ?? allLineups[0]?.id ?? null;
  const activeLineup =
    defaultLineupId !== null
      ? allLineups.find((l) => l.id === defaultLineupId) ?? (await getLineup(defaultLineupId))
      : null;

  const lineupEntries = activeLineup ? await listLineupWithStats(activeLineup.id) : [];
  const stats = activeLineup ? summarizeLineup(lineupEntries) : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12 md:px-10">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium text-emerald-600">Skill Issue</p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          My Lineup
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600">
          Add players from Browse, then review combined stats here. Totals and
          averages use per-game numbers aggregated from game logs.
        </p>
      </header>

      <LineupSwitcher allLineups={allLineups} activeLineup={activeLineup} />

      {!activeLineup ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-zinc-900">No lineups yet</p>
          <p className="mt-2 text-sm text-zinc-600">
            Create a lineup to start adding players.
          </p>
          <CreateLineupForm redirectTo="/lineup" cta="Create lineup" />
        </div>
      ) : lineupEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-zinc-900">
            No players in “{activeLineup.name}”
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Start building from the browse page.
          </p>
          <Link
            href="/browse"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            Browse players
          </Link>
        </div>
      ) : (
        <>
          {stats && (
            <section className="flex flex-col gap-4">
              <SummaryCard title="Lineup total (per-game)" stats={stats.totals} />
              <SummaryCard title="Average per player" stats={stats.averages} />
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">Players</h2>
                <p className="text-sm text-zinc-600">
                  {lineupEntries.length} {lineupEntries.length === 1 ? "player" : "players"} in{" "}
                  “{activeLineup.name}”
                </p>
              </div>
              <code className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-800">
                per-game averages
              </code>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Team</th>
                    <th className="px-4 py-3">Pos</th>
                    <th className="px-4 py-3 text-right">FG%</th>
                    <th className="px-4 py-3 text-right">FT%</th>
                    <th className="px-4 py-3 text-right">3PTM</th>
                    <th className="px-4 py-3 text-right">PTS</th>
                    <th className="px-4 py-3 text-right">REB</th>
                    <th className="px-4 py-3 text-right">AST</th>
                    <th className="px-4 py-3 text-right">ST</th>
                    <th className="px-4 py-3 text-right">BLK</th>
                    <th className="px-4 py-3 text-right">TO</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {lineupEntries.map(({ lineupPlayer, player, stats: playerStats }) => (
                    <tr key={lineupPlayer.id} className="hover:bg-zinc-50">
                      <td className="px-4 py-3 text-zinc-900">
                        <div className="font-medium">
                          {player.firstName} {player.lastName}
                        </div>
                        <div className="text-xs text-zinc-500">{player.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {player.teamCity && player.teamName
                          ? `${player.teamCity} ${player.teamName}`
                          : player.teamName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{player.position ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-zinc-800">
                        {renderPct(playerStats.fgPct)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-800">
                        {renderPct(playerStats.ftPct)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-800">
                        {renderNumber(playerStats.threePtMade)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-800">
                        {renderNumber(playerStats.points)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-800">
                        {renderNumber(playerStats.rebounds)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-800">
                        {renderNumber(playerStats.assists)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-800">
                        {renderNumber(playerStats.steals)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-800">
                        {renderNumber(playerStats.blocks)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-800">
                        {renderNumber(playerStats.turnovers)}
                      </td>
                      <td className="px-4 py-3">
                        <form action={removePlayerFromLineupAction} className="flex justify-center">
                          <input type="hidden" name="playerId" value={player.id} />
                          <input type="hidden" name="lineupId" value={activeLineup.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                            aria-label={`Remove ${player.firstName} ${player.lastName} from lineup`}
                          >
                            Remove
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function parseLineupId(raw: string | string[] | undefined | null) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function LineupSwitcher({
  allLineups,
  activeLineup,
}: {
  allLineups: Awaited<ReturnType<typeof listLineups>>;
  activeLineup: Awaited<ReturnType<typeof getLineup>> | null;
}) {
  const hasLineups = allLineups.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-sm font-semibold text-zinc-900">Lineups</div>
      {hasLineups ? (
        <form action="/lineup" className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-600" htmlFor="lineupId">
            Active
          </label>
          <select
            id="lineupId"
            name="lineupId"
            defaultValue={activeLineup?.id}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {allLineups.map((lineup) => (
              <option key={lineup.id} value={lineup.id}>
                {lineup.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-emerald-400 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            Load
          </button>
        </form>
      ) : (
        <p className="text-sm text-zinc-600">No saved lineups yet.</p>
      )}

      <CreateLineupForm redirectTo="/lineup" />

      <Link
        href="/lineups"
        className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        Compare lineups
      </Link>
    </div>
  );
}

function CreateLineupForm({ redirectTo, cta = "New lineup" }: { redirectTo: string; cta?: string }) {
  return (
    <form action={createLineupAndRedirectAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <label className="text-xs font-medium uppercase tracking-wide text-zinc-600" htmlFor="lineupName">
        Create
      </label>
      <input
        id="lineupName"
        name="name"
        placeholder="Lineup name"
        className="w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        {cta}
      </button>
    </form>
  );
}

function renderNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return value.toFixed(1);
}

function renderPct(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function SummaryCard({
  title,
  stats,
}: {
  title: string;
  stats: {
    fgPct: number | null;
    ftPct: number | null;
    threePtMade: number;
    points: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
  };
}) {
  const summaryItems: { label: string; value: string }[] = [
    { label: "FG%", value: renderPct(stats.fgPct) },
    { label: "FT%", value: renderPct(stats.ftPct) },
    { label: "3PTM", value: renderNumber(stats.threePtMade) },
    { label: "PTS", value: renderNumber(stats.points) },
    { label: "REB", value: renderNumber(stats.rebounds) },
    { label: "AST", value: renderNumber(stats.assists) },
    { label: "ST", value: renderNumber(stats.steals) },
    { label: "BLK", value: renderNumber(stats.blocks) },
    { label: "TO", value: renderNumber(stats.turnovers) },
  ];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="text-sm font-medium text-zinc-500">{title}</div>
      <div className="mt-4 overflow-x-auto">
        <dl className="flex min-w-max flex-nowrap items-stretch gap-2 text-center">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="flex w-24 flex-col justify-center rounded-xl bg-zinc-50 px-3 py-2"
            >
              <dt className="text-[11px] uppercase tracking-wide text-zinc-600">{item.label}</dt>
              <dd className="text-lg font-semibold text-zinc-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
