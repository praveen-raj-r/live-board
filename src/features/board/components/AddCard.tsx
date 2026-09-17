import { useRef, useState } from 'react';

interface AddCardProps {
  onAdd: (title: string) => void;
}

export function AddCard({ onAdd }: AddCardProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
    inputRef.current?.focus();
  };

  return (
    <form
      className="flex shrink-0 items-center gap-1.5 px-2 pb-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-border bg-bg px-2 py-1.5 transition-colors hover:border-border-strong focus-within:border-accent focus-within:bg-surface">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" className="shrink-0 text-text-faint" aria-hidden="true">
          <path d="M8 3v10M3 8h10" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a card"
          aria-label="Add a card"
          enterKeyHint="done"
          className="w-full bg-transparent text-[13px] text-text placeholder:text-text-faint outline-none"
        />
      </div>
      {value.trim() ? (
        <button
          type="submit"
          aria-label="Add card"
          className="shrink-0 rounded-md bg-accent px-2.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Add
        </button>
      ) : null}
    </form>
  );
}
