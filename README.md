# LiveBoard

A single-page, real-time collaborative Kanban board. One board, shared via URL — no accounts, no onboarding, no settings.

Built with Vite, React 18, TypeScript (strict), `@dnd-kit`, Tailwind CSS, TanStack Query, and Supabase (Postgres + Realtime).

See [`liveboard-spec.md`](./liveboard-spec.md) for the full project spec.

**Status:** Phases 1 and 2 are done (static board with full drag & drop, Supabase persistence, realtime sync, presence + live cursors). Phase 3 (final polish pass, deploy, demo recording) is in progress.

## How to Use

- **Open the app.** Visiting the site's root URL creates a brand-new board (with three default columns — To Do, In Progress, Done) and takes you to its own permanent link, `/b/<board-id>`.
- **Share it.** Click **Copy link** in the header to copy that board's URL. Anyone who opens it lands on the exact same board — there's no sign-in, and edits, drags, and card content sync to everyone live. Bookmark or save the link yourself too: revisiting the root URL always creates a *new* board, so the copied link is how you get back to this one.
- **Rename the board.** Click the board title to edit it inline; press Enter or click away to save.
- **Columns.** Click **+ Add column** to create one, click a column's title to rename it, or use the trash icon to delete it (this also deletes its cards, after a confirmation). Drag a column by its `⠿` handle to reorder it.
- **Cards.** Type into a column's **+ Add a card** field and press Enter (or tap the **+** button) to add one. Click a card to open it and edit its title/description or delete it — changes save automatically as you leave each field. Drag a card to reorder it within a column or move it to another column.
- **Keyboard drag.** Tab to a card or column's drag handle, press Space to lift it, use the arrow keys to move it (including into other columns), and press Space again to drop it.
- **Collaborators.** Everyone currently on the board shows up as a colored initials chip in the header — click your own chip to change your display name — and you'll see everyone else's mouse cursor moving live on the board.

## Architecture

### Realtime channel layout

One Supabase Realtime channel per board, carrying three concerns at once:

```
channel: board:{boardId}
  ├─ postgres_changes: liveboard_columns (INSERT/UPDATE/DELETE, filter board_id)
  ├─ postgres_changes: liveboard_cards   (INSERT/UPDATE/DELETE, filter board_id)
  ├─ presence:  { userId, name, color }              — keyed by userId, not connection
  └─ broadcast "cursor": { userId, name, color, x, y } — throttled to 40ms client-side
```

`board_id` is denormalized onto `liveboard_cards` (rather than requiring a join through `liveboard_columns`) purely so the Postgres Changes filter can be a flat `board_id=eq.<id>` on both tables.

A Phoenix/Supabase channel can only be `.subscribe()`d once, ever — even after unsubscribing. The channel is therefore created *fresh inside a single effect* in `BoardPage` rather than memoized, because memoizing and reusing it across React 18 StrictMode's dev-mode mount→cleanup→mount cycle throws `tried to join multiple times`. Each concern (`useRealtimeBoard`, `usePresence`, `useCursors`) exposes an `attach(channel)` function; the effect attaches all three before the one `subscribe()` call, since every listener has to be registered before a channel connects.

### Sync strategy: optimistic-first, reconciled by Realtime

Every mutation (`useBoardMutations`) follows the same shape: `onMutate` patches the TanStack Query cache immediately (so the UI never waits on a round trip), the Supabase write happens in the background, and `onError` rolls back to the pre-mutation snapshot if it fails. The realtime subscription (`useRealtimeBoard`) never refetches — it patches the same cache directly from the `postgres_changes` payload, which is what lets a remote drag or edit animate in live instead of popping in after a refresh.

**Echo suppression.** Without it, confirming your *own* write over the realtime channel would be indistinguishable from someone else's change, and a stale echo arriving after a newer edit could silently revert it. `echoTracker.ts` marks a fingerprint before every write — a card's `updated_at`, or a synthetic `title+position` fingerprint for columns (which have no `updated_at`) — and the realtime handler "consumes" a matching mark and skips re-applying it. A non-matching event is always a genuine remote change and gets applied.

### Conflict strategy: last-write-wins

Two people editing the same card resolve by `updated_at` — whichever write reaches Postgres last simply wins; there's no merge. This is a deliberate v1 tradeoff, not an oversight: a proper CRDT (e.g. a LWW-register per field, or something like Yjs/Automerge for the description text) would handle concurrent edits to *different fields of the same card*, or concurrent text edits, without either being silently discarded. For a Kanban board — where the dominant interaction is "drag a whole card" rather than "two people typing the same field at once" — plain LWW covers the realistic case with a fraction of the complexity, and it's the same primitive Postgres already gives you for free.

### Data model tradeoffs

- **Fractional-index positions.** `position` is a float; inserting between two rows takes their midpoint, appending takes `max + 1000`. No renormalization job exists — float precision is fine at demo scale, but a board that saw thousands of same-slot inserts would eventually run out of usable precision between two adjacent positions. A renormalization pass (rewrite all positions in a column to clean multiples of 1000) is the fix if that ever mattered.
- **Public RLS policies.** There's no auth in v1, so `liveboard_boards/columns/cards` have a single permissive policy each — `FOR ALL TO public USING (true)`. Anyone with a board's URL has full read/write access to it, which is the intended design (a public, link-shared board), but it does mean the URL itself is the only access control. Deliberately scoped `TO public` rather than `TO anon`: this Supabase project is shared with another app that has real authenticated users, and a policy scoped `TO anon` would be *denied* (not leaked — denied) for an authenticated request, which would make LiveBoard behave inconsistently depending on who's logged into the other app in the same browser.

### Bugs found building this (kept here because they were the interesting part)

- **Postgres Changes silently dropped DELETE events.** The default `REPLICA IDENTITY` only includes primary-key columns in a DELETE's WAL "old" record. The realtime filter is on `board_id` (not the primary key), so Realtime couldn't evaluate the filter for deletes and never sent the event at all — cards deleted by another client would just never disappear. Fixed with `ALTER TABLE ... REPLICA IDENTITY FULL`.
- **Dragging a card past a sibling and dropping exactly on it was a no-op.** The position-resolution logic only ever computed "insert before the card you're hovering." Moving a card *forward* and landing precisely on the next card's center — which the keyboard sensor does on every move, and mouse dragging does often enough — recomputed the same position it started at. Fixed by making the insert direction-aware (before vs. after) based on whether the drag is moving forward or backward through the list.
- **Keyboard-dragging a card into an empty column silently failed.** dnd-kit's default keyboard coordinate getter jumps to the nearest droppable's raw corner. For an empty column that resolves to the column's own (small, header-sized) sortable rect rather than its card-list body, landing the virtual cursor at the column's edge — outside where the app's own collision check looks to decide "you're over this column." Fixed with a board-aware coordinate getter that targets the column's body-droppable rect directly.
- **`tried to join multiple times`.** Covered above under channel layout — reusing a memoized Realtime channel across React 18 StrictMode's simulated remount threw, since a channel instance can only ever be joined once.

## Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon/publishable key.

## Future Work

- **Multiple boards list / dashboard.** Explicitly out of scope for v1 (see `liveboard-spec.md` §5) — the app is one board per shareable URL, with no accounts to key a list off of. A "recently visited boards" list backed by localStorage would be the natural next step without requiring auth.
