# LiveBoard — Real-time Collaborative Kanban Board

> **Purpose of this file:** This is the single source of truth for the project. Claude Code should read this before any task. If a requested feature is not in this file, it goes in the "Future Work" section of the README — it does NOT get built.

## 1. Project Summary

A single-page, real-time collaborative Kanban board. One board, shared via URL. No accounts, no onboarding, no settings. Anyone with the link sees the same board and watches changes happen live — card moves, edits, and other users' presence (name + cursor).

**Why this exists:** Portfolio piece for SaaS frontend roles (target: Rocketlane-style JDs). It must demonstrate: real-time collaboration, drag-and-drop mechanics built from primitives, optimistic UI, and pixel-level interaction polish.

**Definition of DONE (non-negotiable):**

1. Deployed at a public URL (Vercel)
2. 60-second screen recording showing two browsers syncing live
3. README with architecture explanation (sync strategy, conflict handling)

Anything beyond this list is scope creep.

---

## 2. Tech Stack (fixed — do not substitute)

| Concern       | Choice                                                                         | Notes                                                        |
| ------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Build         | Vite + React 18 + TypeScript (strict)                                          | No Next.js — no SSR needed                                   |
| Drag & drop   | `@dnd-kit/core` + `@dnd-kit/sortable`                                          | NOT a Kanban library. We build the board mechanics ourselves |
| Realtime + DB | Supabase (Postgres + Realtime channels)                                        | Broadcast for cursors, Postgres Changes for card data        |
| Data fetching | TanStack Query v5                                                              | Optimistic updates via `onMutate`                            |
| Styling       | Tailwind CSS                                                                   | Custom design tokens, no component library                   |
| Animation     | CSS transitions + `@dnd-kit` transforms; Framer Motion ONLY if CSS can't do it | Keep bundle small                                            |
| Deploy        | Vercel                                                                         | Free tier                                                    |
| State         | TanStack Query cache + minimal local `useState`                                | NO Redux/Zustand — the app is too small to justify it        |

---

## 3. Data Model (Supabase)

### Table: `boards`

| column     | type                                | notes                             |
| ---------- | ----------------------------------- | --------------------------------- |
| id         | uuid, pk, default gen_random_uuid() | board id = the shareable URL slug |
| title      | text, default 'Untitled Board'      |                                   |
| created_at | timestamptz, default now()          |                                   |

### Table: `columns`

| column   | type                                    | notes                                     |
| -------- | --------------------------------------- | ----------------------------------------- |
| id       | uuid, pk                                |                                           |
| board_id | uuid, fk → boards.id, on delete cascade |                                           |
| title    | text                                    |                                           |
| position | double precision                        | fractional indexing for ordering (see §6) |

### Table: `cards`

| column      | type                                     | notes                                        |
| ----------- | ---------------------------------------- | -------------------------------------------- |
| id          | uuid, pk                                 |                                              |
| column_id   | uuid, fk → columns.id, on delete cascade |                                              |
| title       | text                                     |                                              |
| description | text, nullable                           |                                              |
| position    | double precision                         | fractional indexing                          |
| updated_at  | timestamptz, default now()               | used for last-write-wins conflict resolution |

### RLS

- Enable RLS on all tables.
- Policy: allow `select`, `insert`, `update`, `delete` for `anon` role (public board by design — no auth in v1).
- This is intentional and documented in README as a v1 tradeoff.

### Identity (no auth)

- On first load, generate `{ userId: crypto.randomUUID(), name: randomName(), color: randomColor() }` and persist in `localStorage`.
- Random names: adjective + animal ("Brave Falcon"). User can click their name to edit it.
- This localStorage identity is used ONLY for presence display, not authorization.

---

## 4. Features — v1 Scope (complete list, nothing else)

### F1. Board bootstrap

- Visiting `/` creates a new board (with 3 default columns: "To Do", "In Progress", "Done") and redirects to `/b/:boardId`.
- Visiting `/b/:boardId` loads that board. Unknown id → simple "Board not found" state with a "Create new board" button.
- Board title is inline-editable (click to edit, Enter/blur to save).
- "Copy link" button in the header with a copied-state confirmation.

### F2. Columns

- Render columns horizontally, scrollable on overflow (snap scrolling on mobile).
- Add column (button at the end of the list), inline title editing, delete column (with confirm — deleting cascades cards).
- Columns are draggable to reorder (horizontal axis).

### F3. Cards

- Add card via input at the bottom of each column (Enter to add, keeps focus for rapid entry).
- Card shows title; clicking opens a small modal/popover with title + description editing and a delete button.
- Cards are draggable: reorder within a column AND move across columns.

### F4. Drag & drop mechanics (the showcase feature — max polish)

- Built with dnd-kit primitives (DndContext, SortableContext, useSortable).
- DragOverlay with a slight scale-up (1.03) and shadow lift on the dragged card.
- The origin slot shows a subtle placeholder (dashed/ghost).
- Drop animations are smooth (dnd-kit's built-in drop animation, tuned).
- Keyboard support: dnd-kit's KeyboardSensor enabled — cards can be moved with keyboard (space to lift, arrows to move, space to drop). Mention this in README.
- Touch support works (PointerSensor with a small activation distance so taps still open cards).

### F5. Realtime sync (the second showcase feature)

- Subscribe to Supabase **Postgres Changes** for `columns` and `cards` filtered by `board_id`.
- On any remote insert/update/delete → patch the TanStack Query cache directly (do NOT refetch the whole board).
- All local mutations are **optimistic**: `onMutate` updates the cache immediately; `onError` rolls back; server change events reconcile.
- **Echo suppression:** each mutation carries a client-generated `updated_at`; when a realtime event arrives that matches a change we just made (same id + same updated_at, or id in an in-flight set), skip re-applying it.
- **Conflict strategy: last-write-wins by `updated_at`.** Two users dragging the same card = the later write stands. Document this tradeoff in the README (and note that CRDTs would be the next step — talking point, not implementation).

### F6. Presence

- Supabase Realtime **Presence** on channel `board:{boardId}` tracks `{ userId, name, color }`.
- Header shows avatar chips (colored circles with initials) for everyone currently on the board, with a tooltip showing the name.
- **Live cursors:** broadcast cursor position (throttled to ~30–50ms) via channel **Broadcast**. Render other users' cursors as a colored pointer + name label, smoothed with CSS transition (~80ms).
- Cursor positions are sent as coordinates relative to the board container (so they map correctly across window sizes; accept imperfection on very different viewports — README note).
- Users disappear from presence/cursors on disconnect (Presence handles this).

### F7. Polish checklist (each item is a real task)

- [ ] Loading state: skeleton columns + cards (no spinners)
- [ ] Empty column state: subtle "Drop cards here" hint
- [ ] Empty board state: friendly prompt to add a card
- [ ] Hover states on every interactive element (cards lift 1px, buttons tint)
- [ ] Focus-visible rings on all interactive elements (keyboard a11y)
- [ ] `prefers-reduced-motion` respected (disable cursor smoothing + drag scale)
- [ ] Mobile: columns snap-scroll horizontally; drag works with touch
- [ ] Favicon, page title updates to board title, OG meta tags
- [ ] No layout shift on load (reserve space)

---

## 5. Explicitly OUT of scope (do not build, do not suggest)

- Authentication / user accounts
- Multiple boards list / dashboard
- Card labels, due dates, assignees, attachments, comments
- Board permissions / private boards
- Dark mode toggle (pick ONE good theme and ship it)
- Search / filtering
- Undo/redo
- Column WIP limits
- Any landing page beyond the board itself

If any of these are requested mid-build, add them to README "Future Work" instead.

---

## 6. Key Implementation Notes

### Fractional-index ordering

- `position` is a float. Insert between A and B → `(A.position + B.position) / 2`. Append → `max + 1000`. First item → `1000`.
- No renormalization job in v1 (float precision is fine for demo-scale usage; note in README).

### Drag-end resolution

On `onDragEnd`, compute: target column + neighbor positions → new fractional position → optimistic cache move → single `update` mutation on the card (`column_id`, `position`, `updated_at`).

### Realtime channel layout (one channel per board)

```
channel: board:{boardId}
  ├─ postgres_changes: columns (INSERT/UPDATE/DELETE, filter board_id)
  ├─ postgres_changes: cards   (INSERT/UPDATE/DELETE, filter via column ids or board_id denorm)
  ├─ presence: { userId, name, color }
  └─ broadcast event "cursor": { userId, x, y }   // throttled client-side
```

Note: if filtering `cards` by board requires it, denormalize `board_id` onto `cards` — acceptable and simpler.

### Suggested folder structure

```
src/
  main.tsx, App.tsx, router.tsx
  lib/supabase.ts          // client init
  lib/identity.ts          // localStorage anon identity
  lib/positions.ts         // fractional indexing helpers
  features/board/
    BoardPage.tsx
    hooks/useBoardQuery.ts
    hooks/useBoardMutations.ts   // optimistic mutations
    hooks/useRealtimeBoard.ts    // pg changes → cache patches
    hooks/usePresence.ts
    hooks/useCursors.ts
    components/Column.tsx
    components/Card.tsx
    components/CardModal.tsx
    components/AddCard.tsx
    components/PresenceBar.tsx
    components/Cursors.tsx
    components/BoardHeader.tsx
  components/ui/           // tiny shared primitives only if reused 2+ times
```

### Design direction (keep it opinionated, not generic)

- One accent color, warm neutral background (not pure white), soft shadows, 8px spacing grid.
- Cards: rounded-lg, subtle border, shadow only on hover/drag.
- Typography: one variable font (e.g. Inter), tight sizes — 13–14px card text, don't oversize.
- The board should look like a product screenshot, not a tutorial project. When in doubt: less chrome, more whitespace, faster transitions (120–180ms).

---

## 7. Build Plan (3 phases = 3 weekends)

### Phase 1 — Static board with full drag & drop (no backend)

1. Scaffold Vite + TS + Tailwind, set up folder structure, design tokens.
2. Hardcoded board data in memory; render columns + cards.
3. Full dnd-kit implementation: card reorder, cross-column move, column reorder, DragOverlay, keyboard sensor, drop animations.
4. Card add/edit/delete + column add/edit/delete against local state.
5. Polish pass #1: hover/focus states, empty states.
   **Exit criteria:** the board feels great to use with zero network code.

### Phase 2 — Supabase: persistence + realtime + presence

1. Create Supabase project, run schema SQL, set RLS policies.
2. Board bootstrap flow (`/` → create → `/b/:id`), load board via TanStack Query.
3. Wire all mutations with optimistic updates + rollback.
4. Postgres Changes subscription → cache patching + echo suppression.
5. Presence chips + live cursors (broadcast, throttled, smoothed).
   **Exit criteria:** two browser windows stay in sync; dragging in one animates in the other; cursors visible.

### Phase 3 — Ship

1. Polish pass #2: full checklist in F7, `prefers-reduced-motion`, mobile pass.
2. Deploy to Vercel (env vars for Supabase URL/anon key).
3. README: what it is, architecture diagram (channel layout above), sync + conflict strategy, tradeoffs (LWW vs CRDT, open RLS, float positions), Future Work list.
4. Record 60-second demo: open two windows, add cards, drag simultaneously, show cursors, edit board title. Add GIF/link to README + portfolio site.
   **Exit criteria:** public URL + recording + README exist. STOP HERE.

---

## 8. Working Agreements for Claude Code

- TypeScript strict mode; no `any` (use `unknown` + narrowing where needed).
- Every mutation hook must implement `onMutate` / `onError` rollback / cache reconciliation — no fire-and-forget writes.
- No new dependencies beyond §2 without explicit approval.
- Prefer small components; extract only on second use.
- After each phase, run `tsc --noEmit` and fix all errors before moving on.
- If a task is ambiguous, choose the smaller interpretation.
- Never add features from §5. If asked, respond by adding a line to README "Future Work".
