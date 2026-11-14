import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConnectionBanner } from './ConnectionBanner';

describe('ConnectionBanner', () => {
  it('is shown only when offline', () => {
    const { rerender } = render(<ConnectionBanner state="offline" />);
    expect(screen.getByRole('status')).toHaveTextContent(/Reconnecting/);
    rerender(<ConnectionBanner state="online" />);
    expect(screen.queryByRole('status')).toBeNull();
    rerender(<ConnectionBanner state="connecting" />);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
