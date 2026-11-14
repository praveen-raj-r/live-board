import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFakeChannel } from '../../../test/fakes';
import { useCursors } from './useCursors';

const self = { userId: 'me', name: 'Me', color: '#000000' };

function setup() {
  const fake = createFakeChannel();
  const hook = renderHook(() => useCursors(self));
  act(() => hook.result.current.attach(fake.channel as never));
  return { fake, hook };
}

function clock(start = 1000) {
  let now = start;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  return (ms: number) => {
    now += ms;
  };
}

afterEach(() => vi.restoreAllMocks());

describe('useCursors: sending', () => {
  it('does nothing before a channel is attached', () => {
    const { result } = renderHook(() => useCursors(self));
    expect(() => result.current.sendCursor(1, 2)).not.toThrow();
  });

  it('broadcasts identity and coordinates', () => {
    clock();
    const { fake, hook } = setup();
    hook.result.current.sendCursor(10, 20);
    expect(fake.channel.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'cursor',
      payload: { ...self, x: 10, y: 20 },
    });
  });

  it('throttles to one message per 40ms', () => {
    const advance = clock();
    const { fake, hook } = setup();
    const { sendCursor } = hook.result.current;

    sendCursor(1, 1); // sent
    advance(10);
    sendCursor(2, 2); // dropped
    advance(29);
    sendCursor(3, 3); // dropped (39ms since last send)
    expect(fake.channel.send).toHaveBeenCalledTimes(1);

    advance(1);
    sendCursor(4, 4); // 40ms: sent
    expect(fake.channel.send).toHaveBeenCalledTimes(2);
    expect(fake.channel.send.mock.calls[1][0].payload).toMatchObject({ x: 4, y: 4 });
  });
});

describe('useCursors: receiving', () => {
  it('stores remote cursors by userId and notifies subscribers', () => {
    const { fake, hook } = setup();
    const { store } = hook.result.current;
    const listener = vi.fn();
    store.subscribe(listener);

    fake.fire('broadcast:cursor', { payload: { userId: 'u2', name: 'Bob', color: '#fff', x: 5, y: 6 } });
    fake.fire('broadcast:cursor', { payload: { userId: 'u2', name: 'Bob', color: '#fff', x: 7, y: 8 } });

    expect(store.getSnapshot().size).toBe(1);
    expect(store.getSnapshot().get('u2')).toMatchObject({ x: 7, y: 8 });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('ignores our own cursor echoed back', () => {
    const { fake, hook } = setup();
    fake.fire('broadcast:cursor', { payload: { ...self, x: 1, y: 1 } });
    expect(hook.result.current.store.getSnapshot().size).toBe(0);
  });

  it('returns a new snapshot object on change and stops notifying after unsubscribe', () => {
    const { fake, hook } = setup();
    const { store } = hook.result.current;
    const before = store.getSnapshot();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    fake.fire('broadcast:cursor', { payload: { userId: 'u2', name: 'B', color: '#fff', x: 1, y: 1 } });
    expect(store.getSnapshot()).not.toBe(before);
    unsubscribe();
    fake.fire('broadcast:cursor', { payload: { userId: 'u2', name: 'B', color: '#fff', x: 2, y: 2 } });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
