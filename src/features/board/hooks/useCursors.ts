import type { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useRef, useState } from 'react';
import type { Identity } from '../../../lib/identity';

export interface CursorPosition extends Identity {
  x: number;
  y: number;
}

const THROTTLE_MS = 40;

/**
 * External store for remote cursors. Lives outside React state on purpose: cursor
 * messages arrive many times a second, and only the <Cursors> component should
 * re-render for them — not the whole board.
 */
export interface CursorStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): ReadonlyMap<string, CursorPosition>;
  set(cursor: CursorPosition): void;
}

function createCursorStore(): CursorStore {
  let snapshot: ReadonlyMap<string, CursorPosition> = new Map();
  const listeners = new Set<() => void>();
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    set(cursor) {
      const next = new Map(snapshot);
      next.set(cursor.userId, cursor);
      snapshot = next;
      listeners.forEach((l) => l());
    },
  };
}

/** Receives remote cursors into a store and exposes a throttled sender for our own, once attached to a channel. */
export function useCursors(self: Identity) {
  const [store] = useState(createCursorStore);
  const lastSentAt = useRef(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const attach = useCallback(
    (channel: RealtimeChannel) => {
      channelRef.current = channel;
      channel.on('broadcast', { event: 'cursor' }, ({ payload }: { payload: CursorPosition }) => {
        if (payload.userId === self.userId) return;
        store.set(payload);
      });
    },
    [self.userId, store],
  );

  const sendCursor = useCallback(
    (x: number, y: number) => {
      const channel = channelRef.current;
      if (!channel) return;
      const now = performance.now();
      if (now - lastSentAt.current < THROTTLE_MS) return;
      lastSentAt.current = now;
      const payload: CursorPosition = { userId: self.userId, name: self.name, color: self.color, x, y };
      channel.send({ type: 'broadcast', event: 'cursor', payload });
    },
    [self],
  );

  return { store, attach, sendCursor };
}
