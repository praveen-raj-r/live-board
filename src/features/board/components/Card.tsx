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
        'mb-2 block w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-left text-[13px] leading-snug text-text shadow-none transition-[box-shadow,transform,border-color] duration-150 hover:-translate-y-px hover:border-border-strong hover:shadow-sm',
        isDragging && 'opacity-40',
      )}
    >
      {card.title}
    </button>
  );
}
