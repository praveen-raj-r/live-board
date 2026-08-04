import { useRouteError } from 'react-router-dom';

export function BootstrapError() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : 'Something went wrong creating a new board.';

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-lg font-semibold text-text">Couldn't create a board</h1>
      <p className="max-w-sm text-[13px] text-text-muted">{message}</p>
    </div>
  );
}
