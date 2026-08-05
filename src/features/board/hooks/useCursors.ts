import type { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useRef, useState } from 'react';
import type { Identity } from '../../../lib/identity';

export interface CursorPosition extends Identity {
  x: number;
  y: number;
}

const THROTTLE_MS = 40;

/** Tracks remote cursors and exposes a throttled sender for our own, once attached to a channel. */
export function useCursors(self: Identity) {
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const lastSentAt = useRef(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const attach = useCallback(
    (channel: RealtimeChannel) => {
      channelRef.current = channel;
      channel.on('broadcast', { event: 'cursor' }, ({ payload }: { payload: CursorPosition }) => {
        if (payload.userId === self.userId) return;
        setCursors((prev) => {
          const next = new Map(prev);
          next.set(payload.userId, payload);
          return next;
        });
      });
    },
    [self.userId],
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

  return { cursors, attach, sendCursor };
}
