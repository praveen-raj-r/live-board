import { describe, expect, it } from 'vitest';
import { nextConnectionState } from './connection';

describe('nextConnectionState', () => {
  it('SUBSCRIBED means online', () => {
    expect(nextConnectionState('connecting', 'SUBSCRIBED')).toBe('online');
    expect(nextConnectionState('offline', 'SUBSCRIBED')).toBe('online');
  });
  it.each(['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'])('%s means offline', (status) => {
    expect(nextConnectionState('online', status)).toBe('offline');
  });
  it('ignores unknown statuses', () => {
    expect(nextConnectionState('online', 'SOMETHING_ELSE')).toBe('online');
  });
});
