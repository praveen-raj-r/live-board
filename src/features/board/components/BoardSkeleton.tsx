export function BoardSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-4">
        <div className="h-6 w-40 animate-pulse rounded-md bg-black/5" />
      </header>
      <div className="flex flex-1 items-start gap-3 overflow-hidden px-6 py-4">
        {[0, 1, 2].map((col) => (
          <div key={col} className="flex h-full w-72 shrink-0 flex-col gap-2 rounded-xl border border-border bg-surface p-2">
            <div className="mb-1 h-5 w-24 animate-pulse rounded-md bg-black/5" />
            {[0, 1].map((card) => (
              <div key={card} className="h-9 w-full animate-pulse rounded-lg bg-black/5" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
