import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import { createFakeBackend, createFakeChannel, createWrapper, sampleBoard } from '../../test/fakes';
import { boardQueryKey } from './api';
import { BoardPage } from './BoardPage';
import type { BoardState } from './types';

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn(), channel: vi.fn(), removeChannel: vi.fn() },
}));

function setup() {
  const backend = createFakeBackend();
  vi.mocked(supabase.from).mockImplementation(backend.from as never);
  const fake = createFakeChannel();
  const subscribe = vi.fn();
  vi.mocked(supabase.channel).mockReturnValue({ ...fake.channel, subscribe } as never);
  const { queryClient, wrapper } = createWrapper();
  queryClient.setQueryData<BoardState>(boardQueryKey('b1'), sampleBoard);
  render(<BoardPage boardId="b1" board={sampleBoard} />, { wrapper });
  return { backend, queryClient, subscribe, user: userEvent.setup() };
}

function stubConfirm(answer: boolean) {
  const confirm = vi.fn(() => answer);
  Object.defineProperty(window, 'confirm', { value: confirm, configurable: true, writable: true });
  return confirm;
}

beforeEach(() => {
  vi.mocked(supabase.from).mockReset();
  vi.mocked(supabase.channel).mockReset();
  vi.restoreAllMocks();
});

describe('BoardPage: column delete confirmation', () => {
  it('does nothing when the user cancels the confirm dialog', async () => {
    const confirm = stubConfirm(false);
    const { user, backend } = setup();
    await user.click(screen.getByRole('button', { name: 'Delete To Do column' }));
    expect(confirm).toHaveBeenCalledWith('Delete "To Do" and all its cards?');
    expect(screen.getByRole('button', { name: /One/ })).toBeInTheDocument();
    expect(backend.calls.some((c) => c.op === 'delete')).toBe(false);
  });

  it('deletes the column and its cards when confirmed', async () => {
    stubConfirm(true);
    const { user, backend, queryClient } = setup();
    await user.click(screen.getByRole('button', { name: 'Delete To Do column' }));
    await waitFor(() => expect(backend.calls.some((c) => c.table === 'liveboard_columns' && c.op === 'delete')).toBe(true));
    const board = queryClient.getQueryData<BoardState>(boardQueryKey('b1'))!;
    expect(board.columns.map((c) => c.id)).toEqual(['c2']);
    expect(board.cards).toEqual([]);
  });
});

describe('BoardPage: realtime channel', () => {
  it('subscribes once to board:{id}', () => {
    const { subscribe } = setup();
    expect(supabase.channel).toHaveBeenCalledWith('board:b1', expect.anything());
    expect(subscribe).toHaveBeenCalledTimes(1);
  });

  it('refetches the board only when the channel re-subscribes after a drop', async () => {
    const { subscribe, queryClient } = setup();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const onStatus = subscribe.mock.calls[0][0] as (s: string) => Promise<void>;

    await onStatus('SUBSCRIBED'); // initial join
    expect(invalidate).not.toHaveBeenCalled();

    await onStatus('CHANNEL_ERROR');
    await onStatus('SUBSCRIBED'); // rejoin
    expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: boardQueryKey('b1') });
  });
});
