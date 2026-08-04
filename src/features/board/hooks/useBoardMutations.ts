import { useMutation, useQueryClient } from '@tanstack/react-query';
import { positionAtEnd } from '../../../lib/positions';
import { supabase } from '../../../lib/supabase';
import { boardQueryKey } from '../api';
import type { BoardCard, BoardColumn, BoardState } from '../types';

async function unwrap(response: PromiseLike<{ error: { message: string } | null }>): Promise<void> {
  const { error } = await response;
  if (error) throw new Error(error.message);
}

export function useBoardMutations(boardId: string) {
  const queryClient = useQueryClient();
  const queryKey = boardQueryKey(boardId);

  function snapshot(): BoardState | undefined {
    return queryClient.getQueryData<BoardState | null>(queryKey) ?? undefined;
  }

  function useOptimistic<TVars>(
    mutationFn: (vars: TVars) => Promise<void>,
    apply: (board: BoardState, vars: TVars) => BoardState,
  ) {
    return useMutation({
      mutationFn,
      onMutate: async (vars: TVars) => {
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<BoardState | null>(queryKey);
        if (previous) {
          queryClient.setQueryData<BoardState | null>(queryKey, apply(previous, vars));
        }
        return { previous };
      },
      onError: (_err, _vars, context) => {
        if (context && context.previous !== undefined) {
          queryClient.setQueryData(queryKey, context.previous);
        }
      },
    });
  }

  const setTitleMutation = useOptimistic<{ title: string }>(
    ({ title }) => unwrap(supabase.from('liveboard_boards').update({ title }).eq('id', boardId)),
    (board, { title }) => ({ ...board, title }),
  );

  const addColumnMutation = useOptimistic<BoardColumn>(
    (column) => unwrap(supabase.from('liveboard_columns').insert({ id: column.id, board_id: boardId, title: column.title, position: column.position })),
    (board, column) => ({ ...board, columns: [...board.columns, column] }),
  );

  const renameColumnMutation = useOptimistic<{ id: string; title: string }>(
    ({ id, title }) => unwrap(supabase.from('liveboard_columns').update({ title }).eq('id', id)),
    (board, { id, title }) => ({
      ...board,
      columns: board.columns.map((c) => (c.id === id ? { ...c, title } : c)),
    }),
  );

  const deleteColumnMutation = useOptimistic<{ id: string }>(
    ({ id }) => unwrap(supabase.from('liveboard_columns').delete().eq('id', id)),
    (board, { id }) => ({
      ...board,
      columns: board.columns.filter((c) => c.id !== id),
      cards: board.cards.filter((card) => card.columnId !== id),
    }),
  );

  const reorderColumnMutation = useOptimistic<{ id: string; position: number }>(
    ({ id, position }) => unwrap(supabase.from('liveboard_columns').update({ position }).eq('id', id)),
    (board, { id, position }) => ({
      ...board,
      columns: board.columns.map((c) => (c.id === id ? { ...c, position } : c)),
    }),
  );

  const addCardMutation = useOptimistic<BoardCard>(
    (card) =>
      unwrap(
        supabase.from('liveboard_cards').insert({
          id: card.id,
          board_id: boardId,
          column_id: card.columnId,
          title: card.title,
          description: card.description,
          position: card.position,
          updated_at: card.updatedAt,
        }),
      ),
    (board, card) => ({ ...board, cards: [...board.cards, card] }),
  );

  const updateCardMutation = useOptimistic<{ id: string; title?: string; description?: string | null; updatedAt: string }>(
    ({ id, title, description, updatedAt }) =>
      unwrap(supabase.from('liveboard_cards').update({ title, description, updated_at: updatedAt }).eq('id', id)),
    (board, { id, title, description, updatedAt }) => ({
      ...board,
      cards: board.cards.map((c) =>
        c.id === id
          ? { ...c, ...(title !== undefined ? { title } : {}), ...(description !== undefined ? { description } : {}), updatedAt }
          : c,
      ),
    }),
  );

  const deleteCardMutation = useOptimistic<{ id: string }>(
    ({ id }) => unwrap(supabase.from('liveboard_cards').delete().eq('id', id)),
    (board, { id }) => ({ ...board, cards: board.cards.filter((c) => c.id !== id) }),
  );

  const moveCardMutation = useOptimistic<{ id: string; columnId: string; position: number; updatedAt: string }>(
    ({ id, columnId, position, updatedAt }) =>
      unwrap(supabase.from('liveboard_cards').update({ column_id: columnId, position, updated_at: updatedAt }).eq('id', id)),
    (board, { id, columnId, position, updatedAt }) => ({
      ...board,
      cards: board.cards.map((c) => (c.id === id ? { ...c, columnId, position, updatedAt } : c)),
    }),
  );

  function setTitle(title: string) {
    setTitleMutation.mutate({ title });
  }

  function addColumn(title: string) {
    const board = snapshot();
    if (!board) return;
    const maxPos = board.columns.length ? Math.max(...board.columns.map((c) => c.position)) : null;
    addColumnMutation.mutate({ id: crypto.randomUUID(), title, position: positionAtEnd(maxPos) });
  }

  function renameColumn(id: string, title: string) {
    renameColumnMutation.mutate({ id, title });
  }

  function deleteColumn(id: string) {
    deleteColumnMutation.mutate({ id });
  }

  function reorderColumn(id: string, position: number) {
    reorderColumnMutation.mutate({ id, position });
  }

  function addCard(columnId: string, title: string) {
    const board = snapshot();
    if (!board) return;
    const siblings = board.cards.filter((c) => c.columnId === columnId);
    const maxPos = siblings.length ? Math.max(...siblings.map((c) => c.position)) : null;
    addCardMutation.mutate({
      id: crypto.randomUUID(),
      columnId,
      title,
      description: null,
      position: positionAtEnd(maxPos),
      updatedAt: new Date().toISOString(),
    });
  }

  function updateCard(id: string, patch: Partial<Pick<BoardCard, 'title' | 'description'>>) {
    updateCardMutation.mutate({ id, ...patch, updatedAt: new Date().toISOString() });
  }

  function deleteCard(id: string) {
    deleteCardMutation.mutate({ id });
  }

  function moveCard(cardId: string, columnId: string, position: number) {
    moveCardMutation.mutate({ id: cardId, columnId, position, updatedAt: new Date().toISOString() });
  }

  return {
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
