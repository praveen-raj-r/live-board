import type { BoardCard } from '../types';

export function CardOverlay({ card }: { card: BoardCard }) {
  return (
    <div className="relative w-72 overflow-hidden rounded-xl bg-surface py-2.5 pl-3.5 pr-3 text-left text-[13px] leading-snug text-text shadow-lg before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-accent motion-safe:scale-[1.03]">
      {card.title}
    </div>
  );
}
