import { Link } from 'react-router-dom';

export function BoardNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-lg font-semibold text-text">Board not found</h1>
      <p className="max-w-sm text-[13px] text-text-muted">This board doesn't exist, or the link might be broken.</p>
      <Link
        to="/"
        className="rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Create new board
      </Link>
    </div>
  );
}
