import { useEffect, useRef, useState } from 'react';
import type { BoardCard } from '../types';

interface CardModalProps {
  card: BoardCard;
  onClose: () => void;
  onUpdate: (patch: Partial<Pick<BoardCard, 'title' | 'description'>>) => void;
  onDelete: () => void;
}

export function CardModal({ card, onClose, onUpdate, onDelete }: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? '');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const commitTitle = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== card.title) onUpdate({ title: trimmed });
    else setTitle(card.title);
  };

  const commitDescription = () => {
    const trimmed = description.trim();
    if (trimmed !== (card.description ?? '')) onUpdate({ description: trimmed || null });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit card"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-border bg-surface p-4 shadow-lg"
      >
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          aria-label="Card title"
          className="w-full rounded-md border border-transparent px-1.5 py-1 text-base font-semibold text-text outline-none transition-colors hover:border-border focus:border-accent"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={commitDescription}
          placeholder="Add a description…"
          aria-label="Card description"
          rows={4}
          className="mt-2 w-full resize-none rounded-md border border-transparent px-1.5 py-1 text-[13px] text-text-muted outline-none transition-colors placeholder:text-text-faint hover:border-border focus:border-accent"
        />

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md px-2 py-1 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            Delete card
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
