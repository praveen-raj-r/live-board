import { createBrowserRouter, redirect } from 'react-router-dom';
import { createBoard } from './features/board/api';
import { BoardRoute } from './features/board/BoardRoute';
import { BootstrapError } from './features/board/BootstrapError';
import { RouteError } from './features/board/RouteError';
import { BoardSkeleton } from './features/board/components/BoardSkeleton';

export const router = createBrowserRouter([
  {
    path: '/',
    loader: async () => {
      const boardId = await createBoard();
      return redirect(`/b/${boardId}`);
    },
    element: <BoardSkeleton />,
    errorElement: <BootstrapError />,
  },
  {
    path: '/b/:boardId',
    element: <BoardRoute />,
    errorElement: <RouteError />,
  },
]);
