import { InlineEditable } from '../../../components/ui/InlineEditable';

interface BoardHeaderProps {
  title: string;
  onRename: (title: string) => void;
}

export function BoardHeader({ title, onRename }: BoardHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-4">
      <InlineEditable
        value={title}
        onSubmit={onRename}
        aria-label="Board title"
        className="text-lg font-semibold text-text"
        inputClassName="text-lg font-semibold text-text"
      />
    </header>
  );
}
