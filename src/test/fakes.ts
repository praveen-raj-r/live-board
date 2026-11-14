import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { vi } from 'vitest';
import type { BoardState } from '../features/board/types';

type Result = { data?: unknown; error: { message: string } | null };

export interface RecordedCall {
  table: string;
  op: string;
  args: unknown[];
}

/**
 * A fake of the supabase-js query builder: every chained method returns the same
 * builder, and awaiting it resolves to the configured result for that table.
 * Pass the returned `from` to `vi.mocked(supabase.from).mockImplementation(...)`.
 */
export function createFakeBackend(results: Record<string, Result | (() => Result)> = {}) {
  const calls: RecordedCall[] = [];
  const from = (table: string) => {
    const resolve = (): Result => {
      const r = results[table];
      const value = typeof r === 'function' ? r() : r;
      return value ?? { data: null, error: null };
    };
    const builder: Record<string, unknown> = {};
    for (const op of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single', 'maybeSingle']) {
      builder[op] = (...args: unknown[]) => {
        calls.push({ table, op, args });
        return builder;
      };
    }
    builder.then = (onFulfilled: (r: Result) => unknown, onRejected?: (e: unknown) => unknown) =>
      Promise.resolve(resolve()).then(onFulfilled, onRejected);
    return builder;
  };
  return { from, calls };
}

type Handler = (payload: unknown) => void;

/** A fake Realtime channel that records listeners so tests can fire events at them. */
export function createFakeChannel() {
  const handlers = new Map<string, Handler>();
  let presenceState: Record<string, unknown[]> = {};
  const channel = {
    on: vi.fn((type: string, filter: { table?: string; event?: string }, cb: Handler) => {
      handlers.set(type === 'postgres_changes' ? `pg:${filter.table}` : `${type}:${filter.event}`, cb);
      return channel;
    }),
    send: vi.fn(),
    track: vi.fn(),
    presenceState: () => presenceState,
  };
  return {
    channel,
    setPresence: (state: Record<string, unknown[]>) => {
      presenceState = state;
    },
    fire: (key: string, payload?: unknown) => {
      const h = handlers.get(key);
      if (!h) throw new Error(`no handler registered for ${key}`);
      h(payload);
    },
  };
}

export function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return { queryClient, wrapper };
}

export const sampleBoard: BoardState = {
  id: 'b1',
  title: 'Sprint',
  columns: [
    { id: 'c1', title: 'To Do', position: 1000 },
    { id: 'c2', title: 'Done', position: 2000 },
  ],
  cards: [
    { id: 'k1', columnId: 'c1', title: 'One', description: null, position: 1000, updatedAt: '2026-01-01T00:00:00.000Z' },
    { id: 'k2', columnId: 'c1', title: 'Two', description: 'desc', position: 2000, updatedAt: '2026-01-01T00:00:00.000Z' },
  ],
};
