import { useRef, useState } from 'react';
import type { Identity } from '../../../lib/identity';

interface PresenceBarProps {
  users: Identity[];
  selfId: string;
  onRenameSelf: (name: string) => void;
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function PresenceBar({ users, selfId, onRenameSelf }: PresenceBarProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    onRenameSelf(draft);
    setEditing(false);
  };

  return (
    <div className="flex items-center -space-x-2">
      {users.map((user) => {
        const isSelf = user.userId === selfId;
        return (
          <div key={user.userId} className="relative">
            {isSelf && editing ? (
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
                    setEditing(false);
                  }
                }}
                aria-label="Your name"
                className="absolute right-0 top-9 z-10 w-36 rounded-md border border-accent bg-surface px-2 py-1 text-[12px] shadow-md outline-none"
              />
            ) : null}
            <button
              type="button"
              title={isSelf ? `${user.name} (you) — click to rename` : user.name}
              onClick={
                isSelf
                  ? () => {
                      setDraft(user.name);
                      setEditing(true);
                      requestAnimationFrame(() => {
                        inputRef.current?.focus();
                        inputRef.current?.select();
                      });
                    }
                  : undefined
              }
              style={{ backgroundColor: user.color }}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface text-[11px] font-semibold text-white transition-transform ${isSelf ? 'ring-2 ring-accent/40 hover:scale-105' : ''}`}
            >
              {initialsOf(user.name)}
            </button>
          </div>
        );
      })}
    </div>
  );
}
