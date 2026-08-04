export interface BoardCard {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
  updatedAt: string;
}

export interface BoardColumn {
  id: string;
  title: string;
  position: number;
}

export interface BoardState {
  id: string;
  title: string;
  columns: BoardColumn[];
  cards: BoardCard[];
}
