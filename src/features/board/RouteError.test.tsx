import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RouteError } from './RouteError';

describe('RouteError', () => {
  it('offers reload and a link to a new board', () => {
    render(
      <MemoryRouter>
        <RouteError />
      </MemoryRouter>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New board' })).toHaveAttribute('href', '/');
  });
});
