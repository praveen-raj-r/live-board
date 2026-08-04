import type { BoardCard, BoardColumn } from '../types';

export function ColumnOverlay({ column, cards }: { column: BoardColumn; cards: BoardCard[] }) {
  return (
    <div className="flex max-h-[70vh] w-72 scale-[1.02] flex-col rounded-xl border border-border-strong bg-surface shadow-lg">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 text-[13px] font-semibold text-text">
        {column.title}
        <span className="text-[12px] font-normal tabular-nums text-text-faint">{cards.length}</span>
      </div>
      <div className="overflow-hidden px-2 pb-2">
        {cards.slice(0, 4).map((card) => (
          <div
            key={card.id}
            className="mb-2 rounded-lg border border-border bg-surface px-2.5 py-2 text-left text-[13px] leading-snug text-text"
          >
            {card.title}
          </div>
        ))}
      </div>
    </div>
  );
}
