import type { BoardState } from './types';

const now = new Date().toISOString();

export function createSeedBoard(): BoardState {
  const colTodo = crypto.randomUUID();
  const colInProgress = crypto.randomUUID();
  const colDone = crypto.randomUUID();

  return {
    id: crypto.randomUUID(),
    title: 'Untitled Board',
    columns: [
      { id: colTodo, title: 'To Do', position: 1000 },
      { id: colInProgress, title: 'In Progress', position: 2000 },
      { id: colDone, title: 'Done', position: 3000 },
    ],
    cards: [
      {
        id: crypto.randomUUID(),
        columnId: colTodo,
        title: 'Sketch the onboarding flow',
        description: null,
        position: 1000,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        columnId: colTodo,
        title: 'Write API docs',
        description: null,
        position: 2000,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        columnId: colInProgress,
        title: 'Set up realtime sync',
        description: 'Postgres Changes + presence channel.',
        position: 1000,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        columnId: colDone,
        title: 'Scaffold the project',
        description: null,
        position: 1000,
        updatedAt: now,
      },
    ],
  };
}
