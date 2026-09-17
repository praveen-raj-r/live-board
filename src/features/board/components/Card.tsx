import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../../lib/cn';
import type { BoardCard } from '../types';

interface CardProps {
  card: BoardCard;
  onOpen: () => void;
}

export function Card({ card, onOpen }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', columnId: card.columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      onClick={onOpen}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative mb-2 block w-full touch-none overflow-hidden rounded-xl bg-surface py-2.5 pl-3.5 pr-3 text-left text-[13px] leading-snug text-text shadow-sm transition-[box-shadow,transform] duration-150 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-accent/60 before:transition-colors before:duration-150 hover:-translate-y-0.5 hover:shadow-md hover:before:bg-accent',
        isDragging && 'opacity-40',
      )}
    >
      <div className="line-clamp-2">{card.title}</div>
      {card.description ? (
        <div className="mt-1 line-clamp-2 text-[12px] leading-snug text-text-muted">{card.description}</div>
      ) : null}
      <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded bg-text/90 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity duration-150 group-focus-visible:opacity-100">
        Press Space to move
      </span>
    </button>
  );
}
