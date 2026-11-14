import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins truthy class names with spaces', () => {
    expect(cn('a', 'b')).toBe('a b');
  });
  it('drops false, null, undefined and empty strings', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });
  it('supports conditional classes', () => {
    const active = true;
    const disabled = false;
    expect(cn('base', active && 'on', disabled && 'off')).toBe('base on');
  });
  it('returns an empty string with no input', () => {
    expect(cn()).toBe('');
  });
});
