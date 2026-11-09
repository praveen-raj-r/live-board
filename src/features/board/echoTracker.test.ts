import { describe, expect, it } from 'vitest';
import { columnFingerprint, createEchoTracker } from './echoTracker';

describe('echoTracker', () => {
  it('consumes a matching mark exactly once', () => {
    const t = createEchoTracker();
    t.mark('a', 'v1');
    expect(t.consume('a', 'v1')).toBe(true);
    expect(t.consume('a', 'v1')).toBe(false);
  });
  it('does not consume a different fingerprint and keeps the mark', () => {
    const t = createEchoTracker();
    t.mark('a', 'v1');
    expect(t.consume('a', 'other')).toBe(false);
    expect(t.consume('a', 'v1')).toBe(true);
  });
  it('tracks ids independently', () => {
    const t = createEchoTracker();
    t.mark('a', 'v1');
    expect(t.consume('b', 'v1')).toBe(false);
  });
  it('keeps only the latest mark per id (documented limitation)', () => {
    const t = createEchoTracker();
    t.mark('a', 'v1');
    t.mark('a', 'v2');
    expect(t.consume('a', 'v1')).toBe(false);
    expect(t.consume('a', 'v2')).toBe(true);
  });
  it('column fingerprint depends on title and position', () => {
    expect(columnFingerprint('x', 1)).toBe(columnFingerprint('x', 1));
    expect(columnFingerprint('x', 1)).not.toBe(columnFingerprint('x', 2));
    expect(columnFingerprint('x', 1)).not.toBe(columnFingerprint('y', 1));
  });
});
