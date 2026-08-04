import type { BoardCard } from '../types';

export function CardOverlay({ card }: { card: BoardCard }) {
  return (
    <div className="w-72 scale-[1.03] rounded-lg border border-border-strong bg-surface px-2.5 py-2 text-left text-[13px] leading-snug text-text shadow-lg">
      {card.title}
    </div>
  );
}
