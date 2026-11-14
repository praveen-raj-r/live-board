import { useParams } from 'react-router-dom';
import { BoardNotFound } from './BoardNotFound';
import { BoardPage } from './BoardPage';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { BoardSkeleton } from './components/BoardSkeleton';
import { useBoardQuery } from './hooks/useBoardQuery';

export function BoardRoute() {
  const { boardId } = useParams<{ boardId: string }>();
  const query = useBoardQuery(boardId ?? '');

  if (!boardId) return <BoardNotFound />;
  if (query.isPending) return <BoardSkeleton />;
  if (query.isError || query.data === null) return <BoardNotFound />;

  return (
    <ErrorBoundary title="The board couldn't be displayed">
      <BoardPage boardId={boardId} board={query.data} />
    </ErrorBoundary>
  );
}
