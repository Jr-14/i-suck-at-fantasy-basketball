export const LINEUP_POSITIONS = ["PG", "SG", "G", "SF", "PF", "C"] as const;
export type LineupPosition = (typeof LINEUP_POSITIONS)[number];

const allowedPositions = new Set<string>(LINEUP_POSITIONS);

export function normalizeCustomPositions(values: Iterable<string | null | undefined>): LineupPosition[] {
  const selected = new Set<LineupPosition>();

  for (const value of values) {
    if (!value) continue;
    const normalized = String(value).trim().toUpperCase();
    if (allowedPositions.has(normalized)) {
      selected.add(normalized as LineupPosition);
    }
  }

  return LINEUP_POSITIONS.filter((pos) => selected.has(pos));
}

export function inferPositionsFromPlayerPosition(raw: string | null | undefined): LineupPosition[] {
  if (!raw) return [];

  const parts = raw
    .split(/[^A-Za-z]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const expanded = parts.flatMap((part) => {
    const upper = part.toUpperCase();
    if (upper === "F" || upper === "FWD") return ["SF", "PF"];
    return upper;
  });

  return normalizeCustomPositions(expanded);
}

export function resolveLineupPositions(
  customPositions: string[] | null | undefined,
  fallbackPosition: string | null | undefined,
): LineupPosition[] {
  const custom = normalizeCustomPositions(customPositions ?? []);
  if (custom.length > 0) return custom;

  return inferPositionsFromPlayerPosition(fallbackPosition);
}
