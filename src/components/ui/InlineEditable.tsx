import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';

interface InlineEditableProps {
  value: string;
  onSubmit: (value: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  'aria-label'?: string;
}

export function InlineEditable({
  value,
  onSubmit,
  className,
  inputClassName,
  placeholder,
  'aria-label': ariaLabel,
}: InlineEditableProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onSubmit(trimmed);
    }
    setDraft(trimmed || value);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          'rounded-md border border-accent bg-surface px-1.5 py-0.5 outline-none',
          inputClassName,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      aria-label={ariaLabel}
      className={cn(
        'cursor-text rounded-md px-1.5 py-0.5 text-left transition-colors hover:bg-black/5',
        className,
      )}
    >
      {value || placeholder}
    </button>
  );
}
