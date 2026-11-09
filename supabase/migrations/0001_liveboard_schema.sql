-- LiveBoard schema, RLS policies and Realtime configuration.
-- Reflects the live "my-projects" Supabase project as inspected on 2026-11-09
-- (columns, constraints, indexes, policies, replica identity, publication).
-- Tables are prefixed `liveboard_` because the project is shared with another app.

create table if not exists public.liveboard_boards (
  id         uuid primary key default gen_random_uuid(),
  title      text not null default 'Untitled Board',
  created_at timestamptz not null default now()
);

create table if not exists public.liveboard_columns (
  id       uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.liveboard_boards(id) on delete cascade,
  title    text not null,
  position double precision not null
);

-- board_id is denormalised onto cards so Realtime can filter with a flat
-- `board_id=eq.<id>` (no join through columns).
create table if not exists public.liveboard_cards (
  id          uuid primary key default gen_random_uuid(),
  column_id   uuid not null references public.liveboard_columns(id) on delete cascade,
  board_id    uuid not null references public.liveboard_boards(id) on delete cascade,
  title       text not null,
  description text,
  position    double precision not null,
  updated_at  timestamptz not null default now()
);

create index if not exists liveboard_columns_board_id_idx on public.liveboard_columns (board_id);
create index if not exists liveboard_cards_board_id_idx   on public.liveboard_cards (board_id);
create index if not exists liveboard_cards_column_id_idx  on public.liveboard_cards (column_id);

-- RLS: intentionally open. There is no auth in v1; the board URL is the access
-- control. Scoped TO public (not TO anon) so behaviour is the same whether or not
-- a user of the other app on this project is signed in.
alter table public.liveboard_boards  enable row level security;
alter table public.liveboard_columns enable row level security;
alter table public.liveboard_cards   enable row level security;

create policy "public full access" on public.liveboard_boards
  for all to public using (true) with check (true);
create policy "public full access" on public.liveboard_columns
  for all to public using (true) with check (true);
create policy "public full access" on public.liveboard_cards
  for all to public using (true) with check (true);

-- Realtime: the default REPLICA IDENTITY only puts the primary key in a DELETE's
-- old record, so a `board_id` filter can't be evaluated and DELETE events are
-- silently dropped. FULL fixes that. (Live DB: boards = default, columns/cards = full.)
alter table public.liveboard_columns replica identity full;
alter table public.liveboard_cards   replica identity full;

alter publication supabase_realtime add table
  public.liveboard_boards, public.liveboard_columns, public.liveboard_cards;
