import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { sampleBoard } from '../../../test/fakes';
import type { BoardCard } from '../types';
import { Column } from './Column';

const column = sampleBoard.columns[0];

function renderColumn(cards: BoardCard[] = sampleBoard.cards) {
  const handlers = { onRename: vi.fn(), onDelete: vi.fn(), onAddCard: vi.fn(), onOpenCard: vi.fn() };
  render(
    <DndContext>
      <SortableContext items={[column.id]}>
        <Column column={column} cards={cards} {...handlers} />
      </SortableContext>
    </DndContext>,
  );
  return { user: userEvent.setup(), ...handlers };
}

describe('Column', () => {
  it('renders title, card count and cards', () => {
    renderColumn();
    expect(screen.getByRole('button', { name: 'Column title' })).toHaveTextContent('To Do');
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
  });

  it('shows the empty hint when there are no cards', () => {
    renderColumn([]);
    expect(screen.getByText('Drop cards here')).toBeInTheDocument();
  });

  it('renames via Enter with the column id', async () => {
    const { user, onRename } = renderColumn();
    await user.click(screen.getByRole('button', { name: 'Column title' }));
    await user.clear(screen.getByRole('textbox', { name: 'Column title' }));
    await user.type(screen.getByRole('textbox', { name: 'Column title' }), 'Backlog{Enter}');
    expect(onRename).toHaveBeenCalledExactlyOnceWith('c1', 'Backlog');
  });

  it('renames on blur', async () => {
    const { user, onRename } = renderColumn();
    await user.click(screen.getByRole('button', { name: 'Column title' }));
    await user.type(screen.getByRole('textbox', { name: 'Column title' }), '!');
    await user.tab();
    expect(onRename).toHaveBeenCalledExactlyOnceWith('c1', 'To Do!');
  });

  it('Escape cancels a rename', async () => {
    const { user, onRename } = renderColumn();
    await user.click(screen.getByRole('button', { name: 'Column title' }));
    await user.type(screen.getByRole('textbox', { name: 'Column title' }), 'xyz{Escape}');
    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Column title' })).toHaveTextContent('To Do');
  });

  it('delete button reports the column (confirmation is owned by the board)', async () => {
    const { user, onDelete } = renderColumn();
    await user.click(screen.getByRole('button', { name: 'Delete To Do column' }));
    expect(onDelete).toHaveBeenCalledExactlyOnceWith(column);
  });

  it('adds a trimmed card with Enter and ignores blank input', async () => {
    const { user, onAddCard } = renderColumn();
    const input = screen.getByRole('textbox', { name: 'Add a card' });
    await user.type(input, '   {Enter}');
    expect(onAddCard).not.toHaveBeenCalled();
    await user.type(input, '  Ship it  {Enter}');
    expect(onAddCard).toHaveBeenCalledExactlyOnceWith('c1', 'Ship it');
    expect(input).toHaveValue('');
  });

  it('opens a card with its id', () => {
    const { onOpenCard } = renderColumn();
    fireEvent.click(screen.getByRole('button', { name: /One/ }));
    expect(onOpenCard).toHaveBeenCalledExactlyOnceWith('k1');
  });
});
