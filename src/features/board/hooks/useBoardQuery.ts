import { useQuery } from '@tanstack/react-query';
import { boardQueryKey, fetchBoard } from '../api';

export function useBoardQuery(boardId: string) {
  return useQuery({
    queryKey: boardQueryKey(boardId),
    queryFn: () => fetchBoard(boardId),
    enabled: Boolean(boardId),
  });
}
