import type { KeyboardCoordinateGetter } from '@dnd-kit/core';
import type { BoardCard, BoardColumn } from './types';

interface Size {
  width: number;
  height: number;
}

function centerOf(rect: { left: number; top: number; width: number; height: number }, size: Size) {
  return {
    x: rect.left + rect.width / 2 - size.width / 2,
    y: rect.top + rect.height / 2 - size.height / 2,
  };
}

/**
 * dnd-kit's default sortable coordinate getter jumps to the nearest droppable's
 * raw corner. For an empty column that resolves to the column's own (header-sized)
 * sortable rect rather than its card-list body, so the landing point sits at the
 * column's edge — outside where our closestCenter collision check looks to decide
 * "over". This getter reasons about the board directly instead: sibling card rects
 * for Up/Down, and the target column's body-droppable rect (always present, even
 * empty) for Left/Right — so cross-column moves land reliably either way.
 */
export function createBoardKeyboardCoordinateGetter(
  sortedColumns: BoardColumn[],
  cardsByColumn: Map<string, BoardCard[]>,
): KeyboardCoordinateGetter {
  return (event, { context }) => {
    const { active, collisionRect, droppableRects } = context;
    if (!active || !collisionRect) return undefined;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) return undefined;

    event.preventDefault();
    const size = { width: collisionRect.width, height: collisionRect.height };
    const activeType = active.data.current?.type;

    if (activeType === 'column') {
      if (event.code === 'ArrowUp' || event.code === 'ArrowDown') return undefined;
      const index = sortedColumns.findIndex((c) => c.id === active.id);
      if (index === -1) return undefined;
      const target = sortedColumns[event.code === 'ArrowRight' ? index + 1 : index - 1];
      const rect = target && droppableRects.get(target.id);
      return rect ? centerOf(rect, size) : undefined;
    }

    if (activeType === 'card') {
      const columnId = active.data.current?.columnId as string | undefined;
      if (!columnId) return undefined;

      if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
        const siblings = cardsByColumn.get(columnId) ?? [];
        const index = siblings.findIndex((c) => c.id === active.id);
        if (index === -1) return undefined;
        const target = siblings[event.code === 'ArrowDown' ? index + 1 : index - 1];
        const rect = target && droppableRects.get(target.id);
        return rect ? centerOf(rect, size) : undefined;
      }

      const columnIndex = sortedColumns.findIndex((c) => c.id === columnId);
      if (columnIndex === -1) return undefined;
      const targetColumn = sortedColumns[event.code === 'ArrowRight' ? columnIndex + 1 : columnIndex - 1];
      const rect = targetColumn && droppableRects.get(`${targetColumn.id}::body`);
      return rect ? centerOf(rect, size) : undefined;
    }

    return undefined;
  };
}
