import { useCallback, useState } from 'react';
import { positionAtEnd } from '../../../lib/positions';
import { createSeedBoard } from '../seedData';
import type { BoardCard, BoardColumn, BoardState } from '../types';

export function useBoardState() {
  const [board, setBoard] = useState<BoardState>(() => createSeedBoard());

  const setTitle = useCallback((title: string) => {
    setBoard((b) => ({ ...b, title }));
  }, []);

  const addColumn = useCallback((title: string) => {
    setBoard((b) => {
      const maxPos = b.columns.length ? Math.max(...b.columns.map((c) => c.position)) : null;
      const column: BoardColumn = { id: crypto.randomUUID(), title, position: positionAtEnd(maxPos) };
      return { ...b, columns: [...b.columns, column] };
    });
  }, []);

  const renameColumn = useCallback((id: string, title: string) => {
    setBoard((b) => ({
      ...b,
      columns: b.columns.map((c) => (c.id === id ? { ...c, title } : c)),
    }));
  }, []);

  const deleteColumn = useCallback((id: string) => {
    setBoard((b) => ({
      ...b,
      columns: b.columns.filter((c) => c.id !== id),
      cards: b.cards.filter((card) => card.columnId !== id),
    }));
  }, []);

  const reorderColumn = useCallback((id: string, position: number) => {
    setBoard((b) => ({
      ...b,
      columns: b.columns.map((c) => (c.id === id ? { ...c, position } : c)),
    }));
  }, []);

  const addCard = useCallback((columnId: string, title: string) => {
    setBoard((b) => {
      const siblings = b.cards.filter((c) => c.columnId === columnId);
      const maxPos = siblings.length ? Math.max(...siblings.map((c) => c.position)) : null;
      const card: BoardCard = {
        id: crypto.randomUUID(),
        columnId,
        title,
        description: null,
        position: positionAtEnd(maxPos),
        updatedAt: new Date().toISOString(),
      };
      return { ...b, cards: [...b.cards, card] };
    });
  }, []);

  const updateCard = useCallback((id: string, patch: Partial<Pick<BoardCard, 'title' | 'description'>>) => {
    setBoard((b) => ({
      ...b,
      cards: b.cards.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c)),
    }));
  }, []);

  const deleteCard = useCallback((id: string) => {
    setBoard((b) => ({ ...b, cards: b.cards.filter((c) => c.id !== id) }));
  }, []);

  const moveCard = useCallback((cardId: string, columnId: string, position: number) => {
    setBoard((b) => ({
      ...b,
      cards: b.cards.map((c) =>
        c.id === cardId ? { ...c, columnId, position, updatedAt: new Date().toISOString() } : c,
      ),
    }));
  }, []);

  return {
    board,
    setTitle,
    addColumn,
    renameColumn,
    deleteColumn,
    reorderColumn,
    addCard,
    updateCard,
    deleteCard,
    moveCard,
  };
}
