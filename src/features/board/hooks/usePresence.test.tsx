import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createFakeChannel } from '../../../test/fakes';
import { usePresence } from './usePresence';

const ada = { userId: 'u1', name: 'Ada', color: '#111111' };
const bob = { userId: 'u2', name: 'Bob', color: '#222222' };

describe('usePresence', () => {
  it('starts empty and listens for presence sync', () => {
    const fake = createFakeChannel();
    const { result } = renderHook(() => usePresence());
    expect(result.current.onlineUsers).toEqual([]);
    result.current.attach(fake.channel as never);
    expect(fake.channel.on).toHaveBeenCalledWith('presence', { event: 'sync' }, expect.any(Function));
  });

  it('lists one entry per user key on sync', () => {
    const fake = createFakeChannel();
    const { result } = renderHook(() => usePresence());
    result.current.attach(fake.channel as never);

    fake.setPresence({ u1: [{ ...ada, presence_ref: 'a' }], u2: [{ ...bob, presence_ref: 'b' }] });
    act(() => fake.fire('presence:sync'));
    expect(result.current.onlineUsers.map((u) => u.name)).toEqual(['Ada', 'Bob']);
  });

  it('uses the first connection when one user has several tabs', () => {
    const fake = createFakeChannel();
    const { result } = renderHook(() => usePresence());
    result.current.attach(fake.channel as never);

    fake.setPresence({ u1: [{ ...ada, presence_ref: 'a' }, { ...ada, name: 'Ada (tab 2)', presence_ref: 'b' }] });
    act(() => fake.fire('presence:sync'));
    expect(result.current.onlineUsers).toHaveLength(1);
    expect(result.current.onlineUsers[0].name).toBe('Ada');
  });

  it('removes users who left on the next sync', () => {
    const fake = createFakeChannel();
    const { result } = renderHook(() => usePresence());
    result.current.attach(fake.channel as never);

    fake.setPresence({ u1: [{ ...ada }], u2: [{ ...bob }] });
    act(() => fake.fire('presence:sync'));
    fake.setPresence({ u1: [{ ...ada }] });
    act(() => fake.fire('presence:sync'));
    expect(result.current.onlineUsers.map((u) => u.userId)).toEqual(['u1']);
  });
});
