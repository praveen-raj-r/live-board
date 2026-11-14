# Design decisions and trade-offs

Each entry says what was chosen, what it cost, and what the alternative was. File references are to the code as of this commit. Anything I could not confirm from the code or the running system is marked **unverified**.

## 1. Access model

### No accounts; the board URL is the only "credential"

**Chosen.** There is no auth. `/` creates a board and redirects to `/b/<uuid>`; anyone with that URL edits the board. Identity is a random name and colour kept in `localStorage` and used only for presence (`src/lib/identity.ts`).

**Gave up.** Per-user permissions, private boards, audit trail, abuse controls, and any way to tell who changed a card.

**Alternative.** Supabase Auth with an owner/members table and per-board RLS. Rejected for v1 because the goal was zero-friction sharing (see `liveboard-spec.md` section 5).

### What anyone can do (read, write, delete)

Checked against the live Supabase project on 2026-11-14 and against `supabase/migrations/0001_liveboard_schema.sql`.

| Fact | Evidence |
|---|---|
| RLS is enabled on `liveboard_boards`, `liveboard_columns`, `liveboard_cards`. | `pg_class.relrowsecurity = true` on all three |
| Each table has one policy, `public full access`: `FOR ALL`, role `public`, `USING (true)`, `WITH CHECK (true)`. | `pg_policies` |
| The `anon` and `authenticated` roles hold table privileges `SELECT, INSERT, UPDATE, DELETE` (plus `REFERENCES, TRIGGER, TRUNCATE`) on all three tables. | `information_schema.role_table_grants` |
| The anon key is in the browser bundle (`VITE_SUPABASE_ANON_KEY`). | `src/lib/supabase.ts` |

What that means in practice:

- **Read.** Anyone holding the anon key (that is, anyone who opens the site and reads its JavaScript) can `SELECT` every board, column and card in these tables. They do **not** need a board link. The URL is unguessable-but-not-secret: it hides a board from casual visitors, not from someone who queries the API directly.
- **Write.** The same person can insert boards, columns and cards, and update any row, including titles, descriptions, positions and `column_id`. There are no length limits or content checks in the policies or, as far as the migration shows, in the schema.
- **Delete.** They can delete any board, column or card. Deleting a board cascades to its columns and cards (`ON DELETE CASCADE`).
- **TRUNCATE.** The role holds the `TRUNCATE` privilege, which RLS does not govern. The browser client talks to PostgREST, which does not expose `TRUNCATE`, so I do not expect it to be reachable through the REST API. **Unverified** beyond that reasoning.
- The policies are scoped `TO public`, not `TO anon`, deliberately: the Supabase project is shared with another app that has signed-in users, and a policy scoped to `anon` would be denied for an authenticated request, making LiveBoard behave differently depending on who is signed in elsewhere in the same browser.

I have not changed these policies. Tightening them (for example a per-board secret in the URL checked by a policy, or Supabase Auth) is a product decision.

## 2. Realtime layout

### One channel per board carrying three concerns

**Chosen.** Channel `board:{boardId}` carries Postgres Changes for columns and cards (filter `board_id=eq.<id>`), Presence keyed by `userId`, and a Broadcast `cursor` event (`BoardPage.tsx`, `useRealtimeBoard.ts`, `usePresence.ts`, `useCursors.ts`).

**Gave up.** Isolation: cursor chatter and data changes share one socket subscription. Presence is keyed by user, not connection, so a user with two tabs shows as one chip (the first connection's data is used).

**Alternative.** Separate channels per concern. More sockets and more join handshakes for no benefit at this scale.

### `board_id` denormalised onto cards

**Chosen.** `liveboard_cards.board_id` exists only so the Realtime filter can be flat (`board_id=eq.X`) on both tables.

**Gave up.** A redundant column that must stay consistent with the card's column. **Alternative.** Filter on column ids (the filter language cannot express a join) or subscribe unfiltered and discard.

### `REPLICA IDENTITY FULL` on columns and cards

**Chosen.** With the default identity, a DELETE's old record contains only the primary key, so a `board_id` filter cannot be evaluated and DELETE events are never delivered. The migration sets `REPLICA IDENTITY FULL` on both tables; the live database matches (boards: default, columns and cards: full).

**Gave up.** Larger WAL records on update and delete. **Alternative.** Filter by primary key only (impossible for a board-wide subscription) or re-fetch on any event.

### Channel is created inside the effect, not memoised

**Chosen.** A channel can be subscribed only once. Reusing a memoised instance across React 18 StrictMode's mount, cleanup, mount cycle threw "tried to join multiple times". Each effect run creates a fresh channel, the three hooks `attach(channel)`, then one `subscribe()` (`BoardPage.tsx`).

**Gave up.** A slightly unusual imperative `attach` API on three hooks. **Alternative.** One `useBoardChannel` hook owning all three concerns.

## 3. Sync strategy

### Optimistic updates, realtime patches the cache, no refetch

**Chosen.** Every mutation goes through one wrapper (`useOptimistic` in `useBoardMutations.ts`): cancel in-flight queries, snapshot, apply the change to the TanStack Query cache, write in the background, restore the snapshot on error. Realtime events patch the same cache directly (`useRealtimeBoard.ts`); the board is not refetched per event.

**Gave up.**
- Rollback is a whole-board snapshot, so one failed write can revert other optimistic edits made after it.
- A failed write rolls back silently; there is no user-facing error message (no toast).
- Nothing retries a failed mutation.

**Alternative.** Invalidate and refetch on every event (simpler, but remote drags pop in instead of animating, and costs a read per event).

### Echo suppression

**Chosen.** Before each card or column write, `echoTracker` records a fingerprint: the client-generated `updated_at` for cards, and `title+position` for columns (they have no `updated_at`). When the matching Postgres Changes event arrives, it is consumed and skipped; anything else is applied as a remote change (`echoTracker.ts`).

**Gave up.**
- The tracker holds **one** fingerprint per row id. If a user writes the same row twice quickly, the first echo no longer matches and is applied as if remote, which can briefly show the older value. This is from reading the code and is pinned by a unit test; I have **not reproduced it in a browser**.
- Inserts and deletes are not tracked; they are idempotent (an insert of an existing id replaces the row with identical data; a delete of a missing row is a no-op).

**Alternative.** A queue of pending fingerprints per row, or a per-row version number.

### Refetch after a reconnect

**Chosen.** When the channel re-subscribes after the first successful subscribe, the board query is invalidated (`BoardPage.tsx`). Events sent while the socket was down are not replayed by Postgres Changes, so this resyncs. A banner shows while the channel is `CHANNEL_ERROR`, `TIMED_OUT` or `CLOSED` (`connection.ts`, `ConnectionBanner.tsx`).

**Gave up.** The refetch can overwrite an optimistic edit that has not been written yet; I have not tested that interleaving (**unverified**). The behaviour is covered by unit tests with a fake channel, not by an e2e test against a real dropped socket.

## 4. Conflict resolution

**Chosen.** Last write wins. Whichever write reaches Postgres last stands; `updated_at` is set by the client's clock (`new Date().toISOString()` in `useBoardMutations.ts`), not the server's.

**Gave up.** Concurrent edits to different fields of one card, or to the same text, are not merged; one is lost. Clock skew between clients can make an older edit look newer in the echo fingerprint comparison (the database itself stores whatever was written, last-arrived wins).

**Alternative.** A CRDT (Yjs or Automerge) for descriptions, or per-field LWW registers. Not worth it when the dominant action is moving a whole card.

## 5. Ordering

**Chosen.** `position` is a `double precision`. Insert between neighbours takes the midpoint; append takes max + 1000; the first item gets 1000 (`src/lib/positions.ts`). A drag is a single-row update.

**Gave up.** Float precision is finite: repeated inserts into the same gap eventually produce two equal positions. There is no renormalisation job. At demo scale this is not reachable (the unit test checks 40 consecutive same-slot inserts stay strictly ordered).

**Alternatives.** Integer positions with reindexing (rewrites many rows per drag and produces many realtime events), or string-based fractional indexing / LexoRank (no precision limit, more code, string comparison semantics).

## 6. Drag and drop

**Chosen.** `@dnd-kit/core` + `sortable` primitives, no Kanban library (`BoardPage.tsx`, `dndHelpers.ts`, `keyboardCoordinates.ts`). Pointer sensor with a 4px activation distance so taps still open cards; keyboard sensor with a custom coordinate getter.

**Gave up.** More code to own. Three real bugs came out of it, all fixed and the first one unit-tested: forward drop on a sibling was a no-op (direction-aware insert in `resolveCardDropPosition`), keyboard drag into an empty column landed outside the collision area (custom getter targets the column body droppable), and the channel double-join (section 2).

**Known cost.** A cross-column move writes during `onDragOver` and again in `onDragEnd`, so one drag can produce several writes and echoes.

**Alternatives.** A packaged Kanban component (fast to build, hard to customise and to keep in sync with realtime), or Atlassian's pragmatic-drag-and-drop (lower-level; I did not evaluate it).

## 7. Client state

**Chosen.** TanStack Query's cache is the only store for board data; local `useState` holds the active drag item and open modal id. Remote cursors live in a small external store consumed by `useSyncExternalStore` so cursor traffic re-renders only `<Cursors>`, not the board (`useCursors.ts`). `Column` and `Card` are `React.memo`, with stable handlers via `useStableCallback`.

**Gave up.** The cache is also the sync engine, so cache-patching logic exists in both the mutations and the realtime handlers and must be kept in step by hand. Columns still re-render when any card changes because the per-column card arrays are rebuilt. I did not measure render counts before and after; no performance number is claimed.

**Alternative.** Zustand or Redux with a normalised store. More ceremony for a one-screen app.

## 8. Cursors and presence

**Chosen.** Broadcast cursor events throttled to one per 40 ms on the sender; 80 ms CSS transition on the receiver (`useCursors.ts`, `Cursors.tsx`). Cursors for users not in the presence list are hidden.

**Gave up.** Coordinates are relative to the board container and not adjusted for horizontal scroll, so cursors are only accurate when two users have scrolled alike. Entries for departed users stay in the store (hidden, not deleted).

## 9. Routing and bootstrap

**Chosen.** React Router data router. The `/` route's `loader` creates a board and redirects, so the board exists before the page renders.

**Gave up.** Every request to `/` that runs the app creates a board and three columns, including prefetches and crawlers that execute JavaScript. A failed board query renders "Board not found" (`BoardRoute.tsx`), which conflates a network error with a missing board.

## 10. Error handling

**Chosen.** An error boundary around the board with a "Try again" button, a route-level `errorElement` on `/b/:boardId` with Reload and New board, and the existing bootstrap error on `/`. Boundaries log to the console only.

**Gave up.** There is no error monitoring service; production errors are invisible unless a user reports them. Sentry was considered and not added.

## 11. Testing strategy

- **Unit and integration (Vitest, happy-dom, Testing Library).** Pure logic (positions, echo tracker, drop-position resolution, `cn`, identity), hooks against a fake Supabase builder and fake channel (no network), and components. The fakes are in `src/test/fakes.ts`. A fake can drift from the real client; the e2e suite is the check on that.
- **End to end (Playwright).** Two browser contexts against a real local Supabase stack (`supabase start`: Postgres, PostgREST, Realtime). It exercises card sync, drag reorder, presence and cursors. It does not cover offline/reconnect, column operations or the card modal.
- **Why local Supabase rather than a stub.** A hand-written stub of the Realtime socket would test my emulation of the protocol, not Supabase.
- **CI.** `check` runs lint, typecheck, unit tests and build on pushes and pull requests; `e2e` runs only on pushes to `master`. Both jobs passed on GitHub on `master` on 2026-11-14 (`e2e` ran against a Supabase stack started on the runner).

## 12. Tooling

- **Vite + React 18 + strict TypeScript.** No SSR needed: the page is a client-only app behind a share link.
- **Tailwind v4 with `@theme` tokens**, one light theme.
- **oxlint** for linting (fast, small config). It has no formatter; formatting is by `.editorconfig` only.
- **Bundle.** A single JS chunk (about 537 kB raw, 156 kB gzip when last measured with `npm run size`); there is no code splitting.
