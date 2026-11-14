import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { afterEach } from 'vitest';
import { useIdentity } from './identity';

afterEach(() => localStorage.clear());

const KEY = 'liveboard:identity';

describe('useIdentity', () => {
  it('generates "Adjective Animal" name, a hex colour and a uuid, and persists them', () => {
    const { result } = renderHook(() => useIdentity());
    const { userId, name, color } = result.current.identity;
    expect(userId).toMatch(/^[0-9a-f-]{36}$/);
    expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    expect(color).toMatch(/^#[0-9A-F]{6}$/);
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toEqual({ userId, name, color });
  });

  it('reuses a stored identity', () => {
    const stored = { userId: 'u1', name: 'Calm Owl', color: '#06D6A0' };
    localStorage.setItem(KEY, JSON.stringify(stored));
    const { result } = renderHook(() => useIdentity());
    expect(result.current.identity).toEqual(stored);
  });

  it('replaces corrupt or incomplete stored data with a fresh identity', () => {
    localStorage.setItem(KEY, '{not json');
    const a = renderHook(() => useIdentity()).result.current.identity;
    expect(a.userId).toBeTruthy();

    localStorage.setItem(KEY, JSON.stringify({ userId: 'x' }));
    const b = renderHook(() => useIdentity()).result.current.identity;
    expect(b.name).toBeTruthy();
    expect(b.userId).not.toBe('x');
  });

  it('rename trims, persists, and keeps userId and colour', () => {
    const { result } = renderHook(() => useIdentity());
    const before = result.current.identity;
    act(() => result.current.rename('  Ada  '));
    expect(result.current.identity).toEqual({ ...before, name: 'Ada' });
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}').name).toBe('Ada');
  });

  it('rename ignores blank names', () => {
    const { result } = renderHook(() => useIdentity());
    const before = result.current.identity;
    act(() => result.current.rename('   '));
    expect(result.current.identity).toEqual(before);
  });
});
