import { useState } from 'react';
import { InlineEditable } from '../../../components/ui/InlineEditable';
import type { Identity } from '../../../lib/identity';
import { PresenceBar } from './PresenceBar';

interface BoardHeaderProps {
  title: string;
  onRename: (title: string) => void;
  onlineUsers: Identity[];
  selfId: string;
  onRenameSelf: (name: string) => void;
}

export function BoardHeader({ title, onRename, onlineUsers, selfId, onRenameSelf }: BoardHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable or permission denied; nothing sensible to do
    }
  };

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-6 py-4">
      <div className="flex min-w-0 items-center gap-1">
        <InlineEditable
          value={title}
          onSubmit={onRename}
          aria-label="Board title"
          className="text-lg font-semibold text-text"
          inputClassName="text-lg font-semibold text-text"
        />
        <button
          type="button"
          onClick={copyLink}
          className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-text-muted transition-colors hover:bg-black/5 hover:text-text"
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M3 8.5L6.5 12L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M6 6V4.5A1.5 1.5 0 0 1 7.5 3h5A1.5 1.5 0 0 1 14 4.5v5A1.5 1.5 0 0 1 12.5 11H11" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="2" y="6" width="8" height="8" rx="1.5" />
              </svg>
              Copy link
            </>
          )}
        </button>
      </div>
      <PresenceBar users={onlineUsers} selfId={selfId} onRenameSelf={onRenameSelf} />
    </header>
  );
}
