import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useCallback } from 'react';
import type { Database } from '../../../lib/database.types';
import { boardQueryKey } from '../api';
import { columnFingerprint, type EchoTracker } from '../echoTracker';
import type { BoardCard, BoardColumn, BoardState } from '../types';

type ColumnRow = Database['public']['Tables']['liveboard_columns']['Row'];
type CardRow = Database['public']['Tables']['liveboard_cards']['Row'];

/**
 * Returns a function that attaches Postgres Changes listeners for this board's
 * columns and cards to a channel, patching the query cache directly. The
 * caller is responsible for creating the channel and calling `.subscribe()`
 * after attaching — see BoardPage for why that all has to live in one effect.
 */
export function useRealtimeBoard(boardId: string, echoTracker: EchoTracker) {
  const queryClient = useQueryClient();

  return useCallback(
    (channel: RealtimeChannel) => {
      const queryKey = boardQueryKey(boardId);

      function patch(updater: (board: BoardState) => BoardState) {
        queryClient.setQueryData<BoardState | null>(queryKey, (current) => (current ? updater(current) : current));
      }

      function handleColumnChange(payload: RealtimePostgresChangesPayload<ColumnRow>) {
        if (payload.eventType === 'DELETE') {
          const id = (payload.old as Partial<ColumnRow>).id;
          if (!id) return;
          patch((board) => ({
            ...board,
            columns: board.columns.filter((c) => c.id !== id),
            cards: board.cards.filter((c) => c.columnId !== id),
          }));
          return;
        }

        const row = payload.new as ColumnRow;
        const column: BoardColumn = { id: row.id, title: row.title, position: row.position };
        if (echoTracker.consume(column.id, columnFingerprint(column.title, column.position))) return;

        patch((board) => {
          const exists = board.columns.some((c) => c.id === column.id);
          return {
            ...board,
            columns: exists ? board.columns.map((c) => (c.id === column.id ? column : c)) : [...board.columns, column],
          };
        });
      }

      function handleCardChange(payload: RealtimePostgresChangesPayload<CardRow>) {
        if (payload.eventType === 'DELETE') {
          const id = (payload.old as Partial<CardRow>).id;
          if (!id) return;
          patch((board) => ({ ...board, cards: board.cards.filter((c) => c.id !== id) }));
          return;
        }

        const row = payload.new as CardRow;
        const card: BoardCard = {
          id: row.id,
          columnId: row.column_id,
          title: row.title,
          description: row.description,
          position: row.position,
          updatedAt: row.updated_at,
        };
        if (echoTracker.consume(card.id, card.updatedAt)) return;

        patch((board) => {
          const exists = board.cards.some((c) => c.id === card.id);
          return {
            ...board,
            cards: exists ? board.cards.map((c) => (c.id === card.id ? card : c)) : [...board.cards, card],
          };
        });
      }

      channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'liveboard_columns', filter: `board_id=eq.${boardId}` },
          handleColumnChange,
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'liveboard_cards', filter: `board_id=eq.${boardId}` },
          handleCardChange,
        );
    },
    [boardId, echoTracker, queryClient],
  );
}
