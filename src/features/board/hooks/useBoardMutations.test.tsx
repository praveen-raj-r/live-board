import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../../lib/supabase';
import { createFakeBackend, createWrapper, sampleBoard } from '../../../test/fakes';
import { boardQueryKey } from '../api';
import { createEchoTracker } from '../echoTracker';
import type { BoardState } from '../types';
import { useBoardMutations } from './useBoardMutations';

vi.mock('../../../lib/supabase', () => ({ supabase: { from: vi.fn() } }));

function setup(results: Parameters<typeof createFakeBackend>[0] = {}) {
  const backend = createFakeBackend(results);
  vi.mocked(supabase.from).mockImplementation(backend.from as never);
  const { queryClient, wrapper } = createWrapper();
  queryClient.setQueryData<BoardState>(boardQueryKey('b1'), sampleBoard);
  const echo = createEchoTracker();
  const markSpy = vi.spyOn(echo, 'mark');
  const { result } = renderHook(() => useBoardMutations('b1', echo), { wrapper });
  const board = () => queryClient.getQueryData<BoardState>(boardQueryKey('b1'))!;
  const card = (id: string) => board().cards.find((c) => c.id === id);
  const column = (id: string) => board().columns.find((c) => c.id === id);
  return { result, board, card, column, backend, markSpy };
}

// onMutate awaits cancelQueries first, so the optimistic patch lands a tick after mutate().
beforeEach(() => vi.mocked(supabase.from).mockReset());

describe('useBoardMutations: optimistic updates', () => {
  it('moveCard patches the cache and marks the echo before the write is confirmed', async () => {
    const { result, card, markSpy, backend } = setup();
    act(() => result.current.moveCard('k1', 'c2', 500));

    await waitFor(() => expect(card('k1')?.columnId).toBe('c2'));
    const moved = card('k1')!;
    expect(moved.position).toBe(500);
    expect(markSpy).toHaveBeenCalledWith('k1', moved.updatedAt);

    await waitFor(() => expect(backend.calls.some((c) => c.table === 'liveboard_cards' && c.op === 'update')).toBe(true));
    const update = backend.calls.find((c) => c.op === 'update')!;
    expect(update.args[0]).toMatchObject({ column_id: 'c2', position: 500, updated_at: moved.updatedAt });
  });

  it('rolls back to the pre-mutation snapshot when the write fails', async () => {
    const { result, board, card } = setup({ liveboard_cards: { error: { message: 'boom' } } });
    act(() => result.current.moveCard('k1', 'c2', 500));
    await waitFor(() => expect(board()).toEqual(sampleBoard));
    expect(card('k1')?.columnId).toBe('c1');
  });

  it('addCard appends at max position + 1000 with a generated id', async () => {
    const { result, board, backend } = setup();
    act(() => result.current.addCard('c1', 'New'));
    await waitFor(() => expect(board().cards.some((c) => c.title === 'New')).toBe(true));
    const added = board().cards.find((c) => c.title === 'New')!;
    expect(added.position).toBe(3000);
    expect(added.columnId).toBe('c1');
    expect(added.id).toMatch(/^[0-9a-f-]{36}$/);
    await waitFor(() => expect(backend.calls.some((c) => c.op === 'insert')).toBe(true));
  });

  it('addCard into an empty column starts at 1000', async () => {
    const { result, board } = setup();
    act(() => result.current.addCard('c2', 'First'));
    await waitFor(() => expect(board().cards.find((c) => c.title === 'First')?.position).toBe(1000));
  });

  it('addColumn appends after the last column', async () => {
    const { result, board } = setup();
    act(() => result.current.addColumn('Review'));
    await waitFor(() => expect(board().columns.at(-1)).toMatchObject({ title: 'Review', position: 3000 }));
  });

  it('deleteColumn removes the column and its cards', async () => {
    const { result, board } = setup();
    act(() => result.current.deleteColumn('c1'));
    await waitFor(() => expect(board().columns.map((c) => c.id)).toEqual(['c2']));
    expect(board().cards).toEqual([]);
  });

  it('reorderColumn updates only that column and marks the echo', async () => {
    const { result, column, markSpy } = setup();
    act(() => result.current.reorderColumn('c1', 3000));
    await waitFor(() => expect(column('c1')?.position).toBe(3000));
    expect(column('c2')?.position).toBe(2000);
    expect(markSpy).toHaveBeenCalledWith('c1', JSON.stringify({ title: 'To Do', position: 3000 }));
  });

  it('renameColumn marks the echo with the new title and current position', async () => {
    const { result, column, markSpy } = setup();
    act(() => result.current.renameColumn('c2', 'Shipped'));
    await waitFor(() => expect(column('c2')?.title).toBe('Shipped'));
    expect(markSpy).toHaveBeenCalledWith('c2', JSON.stringify({ title: 'Shipped', position: 2000 }));
  });

  it('updateCard only changes provided fields and bumps updatedAt', async () => {
    const { result, card } = setup();
    act(() => result.current.updateCard('k2', { title: 'Two!' }));
    await waitFor(() => expect(card('k2')?.title).toBe('Two!'));
    expect(card('k2')?.description).toBe('desc');
    expect(card('k2')?.updatedAt).not.toBe('2026-01-01T00:00:00.000Z');
  });

  it('setTitle and deleteCard patch the cache', async () => {
    const { result, board } = setup();
    act(() => result.current.setTitle('Renamed'));
    act(() => result.current.deleteCard('k1'));
    await waitFor(() => expect(board().title).toBe('Renamed'));
    await waitFor(() => expect(board().cards.map((c) => c.id)).toEqual(['k2']));
  });
});
