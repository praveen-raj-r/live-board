import type { RealtimeChannel } from '@supabase/supabase-js';
import { useCallback, useState } from 'react';
import type { Identity } from '../../../lib/identity';

/** Returns everyone currently on the board, plus a function to attach presence sync to a channel. */
export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<Identity[]>([]);

  const attach = useCallback((channel: RealtimeChannel) => {
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<Identity>();
      setOnlineUsers(
        Object.values(state)
          .map((presences) => presences[0])
          .filter((p): p is Identity & { presence_ref: string } => Boolean(p)),
      );
    });
  }, []);

  return { onlineUsers, attach };
}
