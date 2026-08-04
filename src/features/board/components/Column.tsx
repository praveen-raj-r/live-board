import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { InlineEditable } from '../../../components/ui/InlineEditable';
import { cn } from '../../../lib/cn';
import { AddCard } from './AddCard';
import { Card } from './Card';
import type { BoardCard, BoardColumn } from '../types';

interface ColumnProps {
  column: BoardColumn;
  cards: BoardCard[];
  onRename: (title: string) => void;
  onDelete: () => void;
  onAddCard: (title: string) => void;
  onOpenCard: (cardId: string) => void;
}

export function Column({ column, cards, onRename, onDelete, onAddCard, onOpenCard }: ColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  });

  const { setNodeRef: setBodyRef, isOver } = useDroppable({
    id: `${column.id}::body`,
    data: { type: 'column-body', columnId: column.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex h-full w-72 shrink-0 flex-col rounded-xl border border-border bg-surface',
        isDragging && 'opacity-50',
      )}
    >
      <div className="flex shrink-0 items-center gap-1 px-2 pt-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${column.title} column`}
          className="cursor-grab touch-none rounded-md p-1 text-text-faint transition-colors hover:bg-black/5 hover:text-text-muted active:cursor-grabbing"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="4" r="1.3" />
            <circle cx="11" cy="4" r="1.3" />
            <circle cx="5" cy="8" r="1.3" />
            <circle cx="11" cy="8" r="1.3" />
            <circle cx="5" cy="12" r="1.3" />
            <circle cx="11" cy="12" r="1.3" />
          </svg>
        </button>

        <InlineEditable
          value={column.title}
          onSubmit={onRename}
          aria-label="Column title"
          className="flex-1 truncate text-[13px] font-semibold text-text"
          inputClassName="flex-1 text-[13px] font-semibold text-text"
        />

        <span className="shrink-0 px-1 text-[12px] tabular-nums text-text-faint">{cards.length}</span>

        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${column.title} column`}
          className="shrink-0 rounded-md p-1 text-text-faint transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M3 4h10M6.5 4V2.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75V4M4.5 4l.5 9a1 1 0 0 0 1 .95h4a1 1 0 0 0 1-.95l.5-9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div
        ref={setBodyRef}
        className={cn(
          'min-h-16 flex-1 overflow-y-auto px-2 pt-2 transition-colors',
          isOver && 'bg-accent-soft/40',
        )}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.length === 0 ? (
            <p className="px-1 py-3 text-center text-[12px] text-text-faint">Drop cards here</p>
          ) : (
            cards.map((card) => <Card key={card.id} card={card} onOpen={() => onOpenCard(card.id)} />)
          )}
        </SortableContext>
      </div>

      <AddCard onAdd={onAddCard} />
    </div>
  );
}
