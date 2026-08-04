import { supabase } from '../../lib/supabase';
import type { BoardState } from './types';

export function boardQueryKey(boardId: string) {
  return ['board', boardId] as const;
}

const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done'];

/** Creates a new board with the three default columns and returns its id. */
export async function createBoard(): Promise<string> {
  const { data: board, error: boardError } = await supabase.from('liveboard_boards').insert({}).select('id').single();
  if (boardError) throw new Error(boardError.message);

  const { error: columnsError } = await supabase
    .from('liveboard_columns')
    .insert(DEFAULT_COLUMNS.map((title, index) => ({ board_id: board.id, title, position: (index + 1) * 1000 })));
  if (columnsError) throw new Error(columnsError.message);

  return board.id;
}

/** Loads a board with its columns and cards, or `null` if it doesn't exist. */
export async function fetchBoard(boardId: string): Promise<BoardState | null> {
  const { data: board, error: boardError } = await supabase
    .from('liveboard_boards')
    .select('id, title')
    .eq('id', boardId)
    .maybeSingle();
  if (boardError) throw new Error(boardError.message);
  if (!board) return null;

  const [columnsResult, cardsResult] = await Promise.all([
    supabase.from('liveboard_columns').select('id, title, position').eq('board_id', boardId).order('position'),
    supabase
      .from('liveboard_cards')
      .select('id, column_id, title, description, position, updated_at')
      .eq('board_id', boardId)
      .order('position'),
  ]);
  if (columnsResult.error) throw new Error(columnsResult.error.message);
  if (cardsResult.error) throw new Error(cardsResult.error.message);

  return {
    id: board.id,
    title: board.title,
    columns: columnsResult.data.map((c) => ({ id: c.id, title: c.title, position: c.position })),
    cards: cardsResult.data.map((c) => ({
      id: c.id,
      columnId: c.column_id,
      title: c.title,
      description: c.description,
      position: c.position,
      updatedAt: c.updated_at,
    })),
  };
}
