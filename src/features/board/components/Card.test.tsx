import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { sampleBoard } from '../../../test/fakes';
import { Card } from './Card';

function renderCard(card = sampleBoard.cards[1], onOpen = vi.fn()) {
  render(
    <DndContext>
      <SortableContext items={[card.id]}>
        <Card card={card} onOpen={onOpen} />
      </SortableContext>
    </DndContext>,
  );
  return onOpen;
}

describe('Card', () => {
  it('shows title and description', () => {
    renderCard();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByText('desc')).toBeInTheDocument();
  });

  it('omits the description block when there is none', () => {
    renderCard(sampleBoard.cards[0]);
    expect(screen.queryByText('desc')).toBeNull();
  });

  it('calls onOpen with the card id when clicked', () => {
    const onOpen = renderCard();
    fireEvent.click(screen.getByRole('button', { name: /Two/ }));
    expect(onOpen).toHaveBeenCalledExactlyOnceWith('k2');
  });
});
