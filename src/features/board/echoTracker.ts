/**
 * Tracks the fingerprint of each write we just made so the realtime subscription
 * can recognize its own echo and skip re-applying it — otherwise a Postgres Changes
 * event confirming a write we made could arrive after (and stomp) a newer optimistic
 * edit to the same row that happened in between.
 */
export interface EchoTracker {
  mark(id: string, fingerprint: string): void;
  /** Returns true (and forgets the mark) if `fingerprint` matches our own pending write for `id`. */
  consume(id: string, fingerprint: string): boolean;
}

/** Fingerprint for a column's full mutable state (columns have no `updated_at` to key off of). */
export function columnFingerprint(title: string, position: number): string {
  return JSON.stringify({ title, position });
}

export function createEchoTracker(): EchoTracker {
  const pending = new Map<string, string>();
  return {
    mark(id, fingerprint) {
      pending.set(id, fingerprint);
    },
    consume(id, fingerprint) {
      if (pending.get(id) === fingerprint) {
        pending.delete(id);
        return true;
      }
      return false;
    },
  };
}
