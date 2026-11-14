import { Link } from 'react-router-dom';

/** Route-level `errorElement`: shown when a route's element throws while rendering. */
export function RouteError() {
  return (
    <div role="alert" className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-lg font-semibold text-text">This page hit an error</h1>
      <p className="max-w-sm text-[13px] text-text-muted">Reload to try again, or start a new board.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Reload
        </button>
        <Link
          to="/"
          className="rounded-md border border-border px-4 py-2 text-[13px] font-medium text-text transition-colors hover:bg-black/5"
        >
          New board
        </Link>
      </div>
    </div>
  );
}
