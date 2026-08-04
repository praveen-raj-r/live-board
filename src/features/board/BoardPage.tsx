import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { positionBetween } from "../../lib/positions";
import { AddColumnButton } from "./components/AddColumnButton";
import { BoardHeader } from "./components/BoardHeader";
import { CardModal } from "./components/CardModal";
import { CardOverlay } from "./components/CardOverlay";
import { Column } from "./components/Column";
import { ColumnOverlay } from "./components/ColumnOverlay";
import { resolveCardDropPosition } from "./dndHelpers";
import { createBoardKeyboardCoordinateGetter } from "./keyboardCoordinates";
import { useBoardState } from "./hooks/useBoardState";
import type { BoardCard, BoardColumn } from "./types";

export function BoardPage() {
  const {
    board,
    setTitle,
    addColumn,
    renameColumn,
    deleteColumn,
    reorderColumn,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
  } = useBoardState();

  const [activeCard, setActiveCard] = useState<BoardCard | null>(null);
  const [activeColumn, setActiveColumn] = useState<BoardColumn | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const sortedColumns = useMemo(
    () => [...board.columns].sort((a, b) => a.position - b.position),
    [board.columns],
  );

  const cardsByColumn = useMemo(() => {
    const map = new Map<string, BoardCard[]>();
    for (const column of board.columns) map.set(column.id, []);
    for (const card of [...board.cards].sort(
      (a, b) => a.position - b.position,
    )) {
      map.get(card.columnId)?.push(card);
    }
    return map;
  }, [board.columns, board.cards]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: createBoardKeyboardCoordinateGetter(sortedColumns, cardsByColumn),
    }),
  );

  const openCard = openCardId
    ? (board.cards.find((c) => c.id === openCardId) ?? null)
    : null;

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const type = active.data.current?.type;
    if (type === "column") {
      setActiveColumn(board.columns.find((c) => c.id === active.id) ?? null);
    } else if (type === "card") {
      setActiveCard(board.cards.find((c) => c.id === active.id) ?? null);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.data.current?.type !== "card") return;

    const card = board.cards.find((c) => c.id === active.id);
    if (!card) return;

    const targetColumnId = over.data.current?.columnId as string | undefined;
    if (!targetColumnId || targetColumnId === card.columnId) return;

    const overIsCard = over.data.current?.type === "card";
    const position = resolveCardDropPosition(
      board.cards,
      targetColumnId,
      card.id,
      overIsCard ? (over.id as string) : null,
    );
    moveCard(card.id, targetColumnId, position);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeType = active.data.current?.type;
    setActiveCard(null);
    setActiveColumn(null);
    if (!over) return;

    if (activeType === "column") {
      const overColumnId =
        over.data.current?.type === "column"
          ? (over.id as string)
          : (over.data.current?.columnId as string | undefined);
      if (!overColumnId || active.id === overColumnId) return;
      const oldIndex = sortedColumns.findIndex((c) => c.id === active.id);
      const newIndex = sortedColumns.findIndex((c) => c.id === overColumnId);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(sortedColumns, oldIndex, newIndex);
      const idx = reordered.findIndex((c) => c.id === active.id);
      const before = reordered[idx - 1]?.position ?? null;
      const after = reordered[idx + 1]?.position ?? null;
      reorderColumn(active.id as string, positionBetween(before, after));
      return;
    }

    if (activeType === "card") {
      const card = board.cards.find((c) => c.id === active.id);
      if (!card) return;
      const targetColumnId =
        (over.data.current?.columnId as string | undefined) ?? card.columnId;
      const overIsCard =
        over.data.current?.type === "card" && over.id !== active.id;
      const position = resolveCardDropPosition(
        board.cards,
        targetColumnId,
        card.id,
        overIsCard ? (over.id as string) : null,
      );
      moveCard(card.id, targetColumnId, position);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <BoardHeader title={board.title} onRename={setTitle} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveCard(null);
          setActiveColumn(null);
        }}
      >
        <div className="flex flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden px-6 py-4 scrollbar-gutter-stable">
          <SortableContext
            items={sortedColumns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {sortedColumns.map((column) => (
              <Column
                key={column.id}
                column={column}
                cards={cardsByColumn.get(column.id) ?? []}
                onRename={(title) => renameColumn(column.id, title)}
                onDelete={() => {
                  if (
                    window.confirm(
                      `Delete "${column.title}" and all its cards?`,
                    )
                  ) {
                    deleteColumn(column.id);
                  }
                }}
                onAddCard={(title) => addCard(column.id, title)}
                onOpenCard={setOpenCardId}
              />
            ))}
          </SortableContext>

          <AddColumnButton onAdd={addColumn} />
        </div>

        <DragOverlay
          dropAnimation={{
            duration: 180,
            easing: "cubic-bezier(0.2, 0, 0, 1)",
          }}
        >
          {activeCard ? (
            <CardOverlay card={activeCard} />
          ) : activeColumn ? (
            <ColumnOverlay
              column={activeColumn}
              cards={cardsByColumn.get(activeColumn.id) ?? []}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {openCard ? (
        <CardModal
          card={openCard}
          onClose={() => setOpenCardId(null)}
          onUpdate={(patch) => updateCard(openCard.id, patch)}
          onDelete={() => {
            deleteCard(openCard.id);
            setOpenCardId(null);
          }}
        />
      ) : null}
    </div>
  );
}
