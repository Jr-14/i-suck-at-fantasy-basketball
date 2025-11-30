import type { LineupEntryWithStats } from "@/db/queries";

export type LineupSummary = {
  totals: StatSummary;
  averages: StatSummary;
};

export type StatSummary = {
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

export function summarizeLineup(entries: LineupEntryWithStats[]): LineupSummary {
  const count = entries.length || 1;

  const averageValue = (getter: (stats: LineupEntryWithStats["stats"]) => number | null) => {
    let total = 0;
    let seen = 0;
    for (const { stats } of entries) {
      const value = getter(stats);
      if (value !== null && value !== undefined) {
        total += value;
        seen += 1;
      }
    }
    if (seen === 0) return null;
    return total / seen;
  };

  const sumValue = (getter: (stats: LineupEntryWithStats["stats"]) => number | null) =>
    entries.reduce((acc, { stats }) => acc + (getter(stats) ?? 0), 0);

  const fgPctAvg = averageValue((s) => s.fgPct);
  const ftPctAvg = averageValue((s) => s.ftPct);

  const totals: StatSummary = {
    fgPct: fgPctAvg,
    ftPct: ftPctAvg,
    threePtMade: sumValue((s) => s.threePtMade),
    points: sumValue((s) => s.points),
    rebounds: sumValue((s) => s.rebounds),
    assists: sumValue((s) => s.assists),
    steals: sumValue((s) => s.steals),
    blocks: sumValue((s) => s.blocks),
    turnovers: sumValue((s) => s.turnovers),
  };

  return {
    totals,
    averages: {
      fgPct: fgPctAvg,
      ftPct: ftPctAvg,
      threePtMade: totals.threePtMade / count,
      points: totals.points / count,
      rebounds: totals.rebounds / count,
      assists: totals.assists / count,
      steals: totals.steals / count,
      blocks: totals.blocks / count,
      turnovers: totals.turnovers / count,
    },
  };
}
