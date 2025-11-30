import { createLineupAndRedirectAction } from "@/app/actions/lineup";
import { listLineupWithStats, listLineups } from "@/db/queries";
import { summarizeLineup, type StatSummary } from "@/lib/lineup";
import Link from "next/link";

export const runtime = "nodejs";

export default async function LineupsPage() {
  const allLineups = await listLineups();
  const lineupsWithSummaries = await Promise.all(
    allLineups.map(async (lineup) => {
      const entries = await listLineupWithStats(lineup.id);
      return {
        lineup,
        entries,
        summary: summarizeLineup(entries),
      };
    }),
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12 md:px-10">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium text-emerald-600">Skill Issue</p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Lineups & comparison</h1>
        <p className="max-w-2xl text-lg text-zinc-600">
          Save multiple lineups and compare their totals and per-player averages.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <div className="text-sm font-semibold text-zinc-900">Create lineup</div>
        <CreateLineupForm redirectTo="/lineups" />
        <Link
          href="/browse"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        >
          Add players
        </Link>
      </div>

      {lineupsWithSummaries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-zinc-900">No lineups yet</p>
          <p className="mt-2 text-sm text-zinc-600">Create a lineup to start comparing.</p>
        </div>
      ) : (
        <section className="flex flex-col gap-4">
          {lineupsWithSummaries.map(({ lineup, entries, summary }) => (
            <article
              key={lineup.id}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900">{lineup.name}</h2>
                  <p className="text-sm text-zinc-600">
                    {entries.length} {entries.length === 1 ? "player" : "players"}
                  </p>
                </div>
                <Link
                  href={`/lineup?lineupId=${lineup.id}`}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                >
                  Manage
                </Link>
              </div>

              {entries.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-4 text-center text-sm text-zinc-600">
                  No players yet. Add players from Browse.
                </div>
              ) : (
                <>
                  <SummaryStrip title="Lineup total (per-game)" stats={summary.totals} />
                  <SummaryStrip title="Average per player" stats={summary.averages} />
                </>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function SummaryStrip({ title, stats }: { title: string; stats: StatSummary }) {
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
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-600">{title}</div>
      <div className="overflow-x-auto">
        <dl className="flex min-w-max flex-nowrap items-stretch gap-2 text-center">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="flex w-20 flex-col justify-center rounded-lg bg-white px-2.5 py-2 shadow-inner"
            >
              <dt className="text-[11px] uppercase tracking-wide text-zinc-600">{item.label}</dt>
              <dd className="text-sm font-semibold text-zinc-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function CreateLineupForm({ redirectTo }: { redirectTo: string }) {
  return (
    <form action={createLineupAndRedirectAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <label className="text-xs font-medium uppercase tracking-wide text-zinc-600" htmlFor="compareLineupName">
        Name
      </label>
      <input
        id="compareLineupName"
        name="name"
        placeholder="Lineup name"
        className="w-44 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
      >
        Save lineup
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
