import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createFakeChannel, createWrapper, sampleBoard } from '../../../test/fakes';
import { boardQueryKey } from '../api';
import { columnFingerprint, createEchoTracker } from '../echoTracker';
import type { BoardState } from '../types';
import { useRealtimeBoard } from './useRealtimeBoard';

function setup() {
  const { queryClient, wrapper } = createWrapper();
  queryClient.setQueryData<BoardState>(boardQueryKey('b1'), sampleBoard);
  const echo = createEchoTracker();
  const fake = createFakeChannel();
  const { result } = renderHook(() => useRealtimeBoard('b1', echo), { wrapper });
  result.current(fake.channel as never);
  const board = () => queryClient.getQueryData<BoardState>(boardQueryKey('b1'))!;
  return { fake, echo, board };
}

const cardRow = (over: Record<string, unknown> = {}) => ({
  id: 'k3',
  column_id: 'c2',
  board_id: 'b1',
  title: 'Remote',
  description: null,
  position: 1000,
  updated_at: '2026-02-02T00:00:00.000Z',
  ...over,
});

describe('useRealtimeBoard', () => {
  it('subscribes to columns and cards filtered by board_id', () => {
    const { fake } = setup();
    expect(fake.channel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'liveboard_cards', filter: 'board_id=eq.b1' },
      expect.any(Function),
    );
    expect(fake.channel.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'liveboard_columns', filter: 'board_id=eq.b1' },
      expect.any(Function),
    );
  });

  it('applies a remote card INSERT to the cache without refetching', () => {
    const { fake, board } = setup();
    fake.fire('pg:liveboard_cards', { eventType: 'INSERT', new: cardRow() });
    expect(board().cards.find((c) => c.id === 'k3')).toMatchObject({ columnId: 'c2', title: 'Remote' });
  });

  it('applies a remote card UPDATE in place (no duplicate)', () => {
    const { fake, board } = setup();
    fake.fire('pg:liveboard_cards', {
      eventType: 'UPDATE',
      new: cardRow({ id: 'k1', column_id: 'c2', title: 'One moved', position: 500 }),
    });
    const cards = board().cards;
    expect(cards).toHaveLength(2);
    expect(cards.find((c) => c.id === 'k1')).toMatchObject({ columnId: 'c2', title: 'One moved', position: 500 });
  });

  it('removes a card on remote DELETE', () => {
    const { fake, board } = setup();
    fake.fire('pg:liveboard_cards', { eventType: 'DELETE', old: { id: 'k1' } });
    expect(board().cards.map((c) => c.id)).toEqual(['k2']);
  });

  it('skips the echo of our own card write exactly once', () => {
    const { fake, echo, board } = setup();
    const own = '2026-03-03T00:00:00.000Z';
    echo.mark('k1', own);
    fake.fire('pg:liveboard_cards', { eventType: 'UPDATE', new: cardRow({ id: 'k1', title: 'ECHO', updated_at: own }) });
    expect(board().cards.find((c) => c.id === 'k1')!.title).toBe('One');

    // the mark was consumed, so the same event is now treated as a genuine remote change
    fake.fire('pg:liveboard_cards', { eventType: 'UPDATE', new: cardRow({ id: 'k1', title: 'REMOTE', updated_at: own }) });
    expect(board().cards.find((c) => c.id === 'k1')!.title).toBe('REMOTE');
  });

  it('applies an event whose fingerprint does not match our mark', () => {
    const { fake, echo, board } = setup();
    echo.mark('k1', 'mine');
    fake.fire('pg:liveboard_cards', { eventType: 'UPDATE', new: cardRow({ id: 'k1', title: 'Theirs', updated_at: 'theirs' }) });
    expect(board().cards.find((c) => c.id === 'k1')!.title).toBe('Theirs');
  });

  it('applies remote column INSERT/UPDATE and skips own column echo', () => {
    const { fake, echo, board } = setup();
    fake.fire('pg:liveboard_columns', { eventType: 'INSERT', new: { id: 'c3', board_id: 'b1', title: 'QA', position: 3000 } });
    expect(board().columns.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);

    echo.mark('c1', columnFingerprint('Mine', 1500));
    fake.fire('pg:liveboard_columns', { eventType: 'UPDATE', new: { id: 'c1', board_id: 'b1', title: 'Mine', position: 1500 } });
    expect(board().columns.find((c) => c.id === 'c1')!.title).toBe('To Do');

    fake.fire('pg:liveboard_columns', { eventType: 'UPDATE', new: { id: 'c1', board_id: 'b1', title: 'Renamed', position: 1500 } });
    expect(board().columns.find((c) => c.id === 'c1')!.title).toBe('Renamed');
  });

  it('remote column DELETE removes its cards too', () => {
    const { fake, board } = setup();
    fake.fire('pg:liveboard_columns', { eventType: 'DELETE', old: { id: 'c1' } });
    expect(board().columns.map((c) => c.id)).toEqual(['c2']);
    expect(board().cards).toEqual([]);
  });

  it('ignores events when the board is not in the cache', () => {
    const { queryClient, wrapper } = createWrapper();
    const fake = createFakeChannel();
    const { result } = renderHook(() => useRealtimeBoard('b1', createEchoTracker()), { wrapper });
    result.current(fake.channel as never);
    fake.fire('pg:liveboard_cards', { eventType: 'INSERT', new: cardRow() });
    expect(queryClient.getQueryData(boardQueryKey('b1'))).toBeUndefined();
  });
});
