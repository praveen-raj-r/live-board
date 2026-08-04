const GAP = 1000;

/** Fractional index strictly between `before` and `after` (either end may be absent). */
export function positionBetween(before: number | null, after: number | null): number {
  if (before === null && after === null) return GAP;
  if (before === null) return after! / 2;
  if (after === null) return before + GAP;
  return (before + after) / 2;
}

/** Position for an item appended to the end of a list. */
export function positionAtEnd(maxPosition: number | null): number {
  return maxPosition === null ? GAP : maxPosition + GAP;
}
