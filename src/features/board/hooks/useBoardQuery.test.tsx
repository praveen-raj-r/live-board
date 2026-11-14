import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../../lib/supabase';
import { createFakeBackend, createWrapper } from '../../../test/fakes';
import { useBoardQuery } from './useBoardQuery';

vi.mock('../../../lib/supabase', () => ({ supabase: { from: vi.fn() } }));

beforeEach(() => vi.mocked(supabase.from).mockReset());

describe('useBoardQuery', () => {
  it('maps rows into the camelCase board state', async () => {
    const backend = createFakeBackend({
      liveboard_boards: { data: { id: 'b1', title: 'Sprint' }, error: null },
      liveboard_columns: { data: [{ id: 'c1', title: 'To Do', position: 1000 }], error: null },
      liveboard_cards: {
        data: [{ id: 'k1', column_id: 'c1', title: 'One', description: null, position: 1000, updated_at: 't' }],
        error: null,
      },
    });
    vi.mocked(supabase.from).mockImplementation(backend.from as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBoardQuery('b1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      id: 'b1',
      title: 'Sprint',
      columns: [{ id: 'c1', title: 'To Do', position: 1000 }],
      cards: [{ id: 'k1', columnId: 'c1', title: 'One', description: null, position: 1000, updatedAt: 't' }],
    });
    expect(backend.calls.filter((c) => c.op === 'eq').map((c) => c.args)).toContainEqual(['board_id', 'b1']);
  });

  it('resolves to null when the board does not exist', async () => {
    const backend = createFakeBackend({ liveboard_boards: { data: null, error: null } });
    vi.mocked(supabase.from).mockImplementation(backend.from as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBoardQuery('missing'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('surfaces a database error as a query error', async () => {
    const backend = createFakeBackend({ liveboard_boards: { data: null, error: { message: 'down' } } });
    vi.mocked(supabase.from).mockImplementation(backend.from as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBoardQuery('b1'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('down');
  });

  it('does not fetch without a board id', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBoardQuery(''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
