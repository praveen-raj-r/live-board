import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InlineEditable } from './InlineEditable';

function setup(value = 'Backlog') {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<InlineEditable value={value} onSubmit={onSubmit} aria-label="Title" />);
  return { onSubmit, user };
}

describe('InlineEditable', () => {
  it('shows the value as a button and the placeholder when empty', () => {
    render(<InlineEditable value="" onSubmit={() => {}} placeholder="Untitled" aria-label="Title" />);
    expect(screen.getByRole('button', { name: 'Title' })).toHaveTextContent('Untitled');
  });

  it('click switches to a focused input holding the value', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Title' }));
    const input = screen.getByRole('textbox', { name: 'Title' });
    expect(input).toHaveFocus();
    expect(input).toHaveValue('Backlog');
  });

  it('Enter submits the trimmed value and leaves edit mode', async () => {
    const { user, onSubmit } = setup();
    await user.click(screen.getByRole('button', { name: 'Title' }));
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), '  Sprint  {Enter}');
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('Sprint');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('blur submits', async () => {
    const { user, onSubmit } = setup();
    await user.click(screen.getByRole('button', { name: 'Title' }));
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'Next');
    await user.tab();
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('Next');
  });

  it('Escape cancels without submitting', async () => {
    const { user, onSubmit } = setup();
    await user.click(screen.getByRole('button', { name: 'Title' }));
    await user.type(screen.getByRole('textbox'), 'zzz{Escape}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Title' })).toHaveTextContent('Backlog');
  });

  it('does not submit an unchanged or blank value', async () => {
    const { user, onSubmit } = setup();
    await user.click(screen.getByRole('button', { name: 'Title' }));
    await user.type(screen.getByRole('textbox'), '{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Title' }));
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), '   {Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Title' })).toHaveTextContent('Backlog');
  });
});
