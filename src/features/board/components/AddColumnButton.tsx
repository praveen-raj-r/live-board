import { useState } from 'react';

interface AddColumnButtonProps {
  onAdd: (title: string) => void;
}

export function AddColumnButton({ onAdd }: AddColumnButtonProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed) onAdd(trimmed);
    setValue('');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="h-fit w-72 shrink-0 rounded-xl border border-border-strong bg-surface p-2">
        <input
          ref={(el) => el?.focus()}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setValue('');
              setEditing(false);
            }
          }}
          placeholder="Column name"
          aria-label="New column name"
          className="w-full rounded-md border border-accent bg-surface px-2 py-1.5 text-[13px] font-medium outline-none"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="h-fit w-72 shrink-0 rounded-xl border border-dashed border-border-strong px-3 py-2.5 text-left text-[13px] font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
    >
      + Add column
    </button>
  );
}
