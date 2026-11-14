import type { ConnectionState } from '../connection';

/** Visible only while the Realtime channel is down; the board refetches itself when it reconnects. */
export function ConnectionBanner({ state }: { state: ConnectionState }) {
  if (state !== 'offline') return null;
  return (
    <div role="status" className="shrink-0 bg-accent-soft px-6 py-1.5 text-center text-[12px] font-medium text-text">
      Connection lost. Reconnecting… live updates are paused and edits may not save until it returns.
    </div>
  );
}
