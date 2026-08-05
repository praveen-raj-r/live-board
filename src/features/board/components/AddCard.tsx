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
      className="flex shrink-0 items-center gap-1 px-2 pb-2 pt-1"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="+ Add a card"
        aria-label="Add a card"
        enterKeyHint="done"
        className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-[13px] text-text placeholder:text-text-faint outline-none transition-colors hover:border-border focus:border-accent focus:bg-surface"
      />
      {value.trim() ? (
        <button
          type="submit"
          aria-label="Add card"
          className="shrink-0 rounded-md p-1.5 text-accent transition-colors hover:bg-accent-soft"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
            <path d="M8 3v10M3 8h10" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </form>
  );
}
