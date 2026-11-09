import { describe, expect, it } from 'vitest';
import { positionAtEnd, positionBetween } from './positions';

describe('positionBetween', () => {
  it('returns the gap for an empty list', () => {
    expect(positionBetween(null, null)).toBe(1000);
  });
  it('inserts before the first item at half its position', () => {
    expect(positionBetween(null, 1000)).toBe(500);
  });
  it('appends after the last item', () => {
    expect(positionBetween(2000, null)).toBe(3000);
  });
  it('takes the midpoint between neighbours', () => {
    expect(positionBetween(1000, 2000)).toBe(1500);
  });
  it('stays strictly between neighbours under repeated same-slot inserts', () => {
    let after = 2000;
    for (let i = 0; i < 40; i++) {
      const p = positionBetween(1000, after);
      expect(p).toBeGreaterThan(1000);
      expect(p).toBeLessThan(after);
      after = p;
    }
  });
});

describe('positionAtEnd', () => {
  it('starts at the gap', () => expect(positionAtEnd(null)).toBe(1000));
  it('adds the gap to the max', () => expect(positionAtEnd(4500)).toBe(5500));
});
