import { positionAtEnd, positionBetween } from '../../lib/positions';
import type { BoardCard } from './types';

/**
 * Position for `activeCardId` when dropped into `targetColumnId`, targeting
 * `overCardId` if given (else appended to the end).
 *
 * Direction matters: dragging a card *forward* past a sibling (its original
 * index in the target column is before the sibling's) should land it right
 * after that sibling, not back where it started. Only "insert before over"
 * would make forward moves within a column a no-op — this is most visible
 * with keyboard dragging, which lands exactly on the sibling's center every
 * time, but it's the same bug mouse dragging hits less predictably.
 */
export function resolveCardDropPosition(
  cards: BoardCard[],
  targetColumnId: string,
  activeCardId: string,
  overCardId: string | null,
): number {
  const columnCards = cards
    .filter((c) => c.columnId === targetColumnId)
    .sort((a, b) => a.position - b.position);
  const activeIndexBefore = columnCards.findIndex((c) => c.id === activeCardId);
  const siblings = columnCards.filter((c) => c.id !== activeCardId);

  if (overCardId) {
    const overIndex = siblings.findIndex((c) => c.id === overCardId);
    if (overIndex !== -1) {
      const overIndexBefore = columnCards.findIndex((c) => c.id === overCardId);
      const movingForward = activeIndexBefore !== -1 && activeIndexBefore < overIndexBefore;

      const before = (movingForward ? siblings[overIndex] : siblings[overIndex - 1])?.position ?? null;
      const after = (movingForward ? siblings[overIndex + 1] : siblings[overIndex])?.position ?? null;
      return positionBetween(before, after);
    }
  }

  const maxPos = siblings.length ? siblings[siblings.length - 1].position : null;
  return positionAtEnd(maxPos);
}
