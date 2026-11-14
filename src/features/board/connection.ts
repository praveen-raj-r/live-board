export type ConnectionState = 'connecting' | 'online' | 'offline';

/** Maps a Realtime channel status (the argument to `channel.subscribe`'s callback) to what the UI shows. */
export function nextConnectionState(current: ConnectionState, status: string): ConnectionState {
  switch (status) {
    case 'SUBSCRIBED':
      return 'online';
    case 'CHANNEL_ERROR':
    case 'TIMED_OUT':
    case 'CLOSED':
      return 'offline';
    default:
      return current;
  }
}
