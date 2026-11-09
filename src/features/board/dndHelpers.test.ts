import { describe, expect, it } from 'vitest';
import { resolveCardDropPosition } from './dndHelpers';
import type { BoardCard } from './types';

const card = (id: string, columnId: string, position: number): BoardCard => ({
  id,
  columnId,
  title: id,
  description: null,
  position,
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const cards = [card('a', 'c1', 1000), card('b', 'c1', 2000), card('c', 'c1', 3000), card('x', 'c2', 1000)];

describe('resolveCardDropPosition', () => {
  it('moving forward onto a sibling lands after it', () => {
    expect(resolveCardDropPosition(cards, 'c1', 'a', 'b')).toBe(2500);
  });
  it('moving forward onto the last sibling appends after it', () => {
    expect(resolveCardDropPosition(cards, 'c1', 'a', 'c')).toBe(4000);
  });
  it('moving backward onto a sibling lands before it', () => {
    expect(resolveCardDropPosition(cards, 'c1', 'c', 'b')).toBe(1500);
  });
  it('moving backward onto the first sibling goes before it', () => {
    expect(resolveCardDropPosition(cards, 'c1', 'c', 'a')).toBe(500);
  });
  it('never returns the original position when moving forward (the no-op bug)', () => {
    expect(resolveCardDropPosition(cards, 'c1', 'a', 'b')).not.toBe(1000);
  });
  it('from another column, inserts before the hovered card', () => {
    expect(resolveCardDropPosition(cards, 'c1', 'x', 'b')).toBe(1500);
  });
  it('with no over card, appends to the end of the target column', () => {
    expect(resolveCardDropPosition(cards, 'c1', 'x', null)).toBe(4000);
  });
  it('drops into an empty column at the gap', () => {
    expect(resolveCardDropPosition(cards, 'c3', 'a', null)).toBe(1000);
  });
  it('falls back to append if the over card is not in the target column', () => {
    expect(resolveCardDropPosition(cards, 'c1', 'a', 'missing')).toBe(4000);
  });
});
