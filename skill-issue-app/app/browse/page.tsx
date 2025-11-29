import { searchPlayersByNamePaged } from "@/db/queries";
import { fetchPlayerIndex } from "@/lib/nba-api";
import Link from "next/link";

type PageProps = {
  searchParams?:
    | Promise<{ q?: string | string[]; page?: string | string[] }>
    | { q?: string | string[]; page?: string | string[] };
};

export const runtime = "nodejs";

const PAGE_SIZE = 20;

export default async function BrowsePage({ searchParams }: PageProps) {
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<unknown>).then === "function"
      ? await (searchParams as Promise<{ q?: string | string[]; page?: string | string[] }>)
      : ((searchParams as { q?: string | string[]; page?: string | string[] } | undefined) ?? {});

  const rawQuery = resolvedSearchParams.q;
  const query = Array.isArray(rawQuery)
    ? rawQuery[0]?.trim() ?? ""
    : rawQuery?.trim() ?? "";

  const rawPage = resolvedSearchParams.page;
  const parsedPage = Array.isArray(rawPage)
    ? Number.parseInt(rawPage[0] ?? "1", 10)
    : Number.parseInt(rawPage ?? "1", 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  // Ensure the PlayerIndex payload is fetched and cached; on cache miss this also
  // upserts into the `players` table so browsing reads from SQLite.
  await fetchPlayerIndex();

  const { players, total, page: currentPage } = await searchPlayersByNamePaged(
    query,
    page,
    PAGE_SIZE,
  );

  const hasQuery = query.length > 0;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("page", targetPage.toString());
    return `/browse?${params.toString()}`;
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12 md:px-10">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium text-emerald-600">Skill Issue</p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
          Browse NBA Players
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600">
          Search the cached PlayerIndex data and view basic player information
          stored in SQLite.
        </p>
      </header>

      <form className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:px-6" action="/browse">
        <div className="flex-1">
          <label className="block text-sm font-medium text-zinc-700" htmlFor="q">
            Search by name
          </label>
          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="e.g. LeBron, Tatum, Victor"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-900 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          Search
        </button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Players</h2>
            <p className="text-sm text-zinc-600">
              {hasQuery
                ? `Results for "${query}" — ${total} total`
                : `Showing ${players.length} players (page ${currentPage} of ${totalPages})`}
            </p>
          </div>
          <code className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-800">
            data from SQLite
          </code>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Pos</th>
                <th className="px-4 py-3">Jersey</th>
                <th className="px-4 py-3">Height</th>
                <th className="px-4 py-3">Weight</th>
                <th className="px-4 py-3">Roster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {players.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-zinc-600" colSpan={8}>
                    No players found. Try a different search.
                  </td>
                </tr>
              ) : (
                players.map((player) => (
                  <tr key={player.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                      {player.id}
                    </td>
                    <td className="px-4 py-3 text-zinc-900">
                      <Link
                        href={`/browse/${player.id}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {player.firstName} {player.lastName}
                      </Link>
                      <div className="text-xs text-zinc-500">{player.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {player.teamCity && player.teamName
                        ? `${player.teamCity} ${player.teamName}`
                        : player.teamName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {player.position ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {player.jerseyNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {player.height ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {player.weight ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {formatRosterStatus(player.rosterStatus)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center justify-between text-sm text-zinc-700">
        <div>
          Page {currentPage} of {totalPages} — {total} players
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={buildHref(Math.max(1, currentPage - 1))}
            className={`rounded-lg border px-3 py-2 transition ${currentPage <= 1 ? "cursor-not-allowed border-zinc-200 text-zinc-400" : "border-zinc-300 text-zinc-800 hover:border-emerald-400 hover:text-emerald-700"}`}
            aria-disabled={currentPage <= 1}
            tabIndex={currentPage <= 1 ? -1 : undefined}
          >
            Previous
          </Link>
          <Link
            href={buildHref(Math.min(totalPages, currentPage + 1))}
            className={`rounded-lg border px-3 py-2 transition ${currentPage >= totalPages ? "cursor-not-allowed border-zinc-200 text-zinc-400" : "border-zinc-300 text-zinc-800 hover:border-emerald-400 hover:text-emerald-700"}`}
            aria-disabled={currentPage >= totalPages}
            tabIndex={currentPage >= totalPages ? -1 : undefined}
          >
            Next
          </Link>
        </div>
      </div>
    </main>
  );
}

function formatRosterStatus(value: number | null | undefined) {
  if (value === 1) return "ROSTERED";
  if (value === 0) return "NOT_ROSTERED";
  return "—";
}
