import type { BoardCard, BoardColumn } from '../types';

export function ColumnOverlay({ column, cards }: { column: BoardColumn; cards: BoardCard[] }) {
  return (
    <div className="flex max-h-[70vh] w-72 flex-col rounded-xl border border-border-strong bg-surface shadow-lg motion-safe:scale-[1.02]">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 text-[13px] font-semibold text-text">
        {column.title}
        <span className="text-[12px] font-normal tabular-nums text-text-faint">{cards.length}</span>
      </div>
      <div className="overflow-hidden px-2 pb-2">
        {cards.slice(0, 4).map((card) => (
          <div
            key={card.id}
            className="relative mb-2 overflow-hidden rounded-xl bg-surface py-2.5 pl-3.5 pr-3 text-left text-[13px] leading-snug text-text shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-accent/60"
          >
            {card.title}
          </div>
        ))}
      </div>
    </div>
  );
}
