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
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-6 py-4">
      <InlineEditable
        value={title}
        onSubmit={onRename}
        aria-label="Board title"
        className="text-lg font-semibold text-text"
        inputClassName="text-lg font-semibold text-text"
      />
      <PresenceBar users={onlineUsers} selfId={selfId} onRenameSelf={onRenameSelf} />
    </header>
  );
}
