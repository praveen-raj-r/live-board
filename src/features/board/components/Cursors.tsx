import { useMemo, useSyncExternalStore } from "react";
import type { CursorStore } from "../hooks/useCursors";

interface CursorsProps {
  store: CursorStore;
  onlineUserIds: ReadonlySet<string>;
}

export function Cursors({ store, onlineUserIds }: CursorsProps) {
  const all = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const cursors = useMemo(
    () => Array.from(all.values()).filter((c) => onlineUserIds.has(c.userId)),
    [all, onlineUserIds],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {cursors.map((c) => (
        <div
          key={c.userId}
          className="absolute transition-[left,top] duration-80 ease-out"
          style={{ left: c.x, top: c.y }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill={c.color}
            className="drop-shadow-sm"
          >
            <path
              d="M2 2L16 8L9 9.5L7 16L2 2Z"
              stroke="white"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="ml-3 -mt-1 inline-block whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white"
            style={{ backgroundColor: c.color }}
          >
            {c.name}
          </span>
        </div>
      ))}
    </div>
  );
}
