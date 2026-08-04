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
    <div className="shrink-0 px-2 pb-2 pt-1">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="+ Add a card"
        aria-label="Add a card"
        className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-[13px] text-text placeholder:text-text-faint outline-none transition-colors hover:border-border focus:border-accent focus:bg-surface"
      />
    </div>
  );
}
