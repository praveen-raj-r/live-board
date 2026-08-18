# LiveBoard

A single-page, real-time collaborative Kanban board. One board, shared via URL — no accounts, no onboarding, no settings.

Built with Vite, React 18, TypeScript (strict), `@dnd-kit`, Tailwind CSS, TanStack Query, and Supabase (Postgres + Realtime).

See [`liveboard-spec.md`](./liveboard-spec.md) for the full project spec.

**Status:** Phases 1 and 2 are done (static board with full drag & drop, Supabase persistence, realtime sync, presence + live cursors). Phase 3 (final polish pass, deploy, demo recording) is in progress.

A full architecture writeup — sync strategy, conflict handling, tradeoffs — lands here once Phase 3 is complete.

## How to Use

- **Open the app.** Visiting the site's root URL creates a brand-new board (with three default columns — To Do, In Progress, Done) and takes you to its own permanent link, `/b/<board-id>`.
- **Share it.** Click **Copy link** in the header to copy that board's URL. Anyone who opens it lands on the exact same board — there's no sign-in, and edits, drags, and card content sync to everyone live. Bookmark or save the link yourself too: revisiting the root URL always creates a *new* board, so the copied link is how you get back to this one.
- **Rename the board.** Click the board title to edit it inline; press Enter or click away to save.
- **Columns.** Click **+ Add column** to create one, click a column's title to rename it, or use the trash icon to delete it (this also deletes its cards, after a confirmation). Drag a column by its `⠿` handle to reorder it.
- **Cards.** Type into a column's **+ Add a card** field and press Enter (or tap the **+** button) to add one. Click a card to open it and edit its title/description or delete it — changes save automatically as you leave each field. Drag a card to reorder it within a column or move it to another column.
- **Keyboard drag.** Tab to a card or column's drag handle, press Space to lift it, use the arrow keys to move it (including into other columns), and press Space again to drop it.
- **Collaborators.** Everyone currently on the board shows up as a colored initials chip in the header — click your own chip to change your display name — and you'll see everyone else's mouse cursor moving live on the board.

## Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon/publishable key.

## Future Work

- **Multiple boards list / dashboard.** Explicitly out of scope for v1 (see `liveboard-spec.md` §5) — the app is one board per shareable URL, with no accounts to key a list off of. A "recently visited boards" list backed by localStorage would be the natural next step without requiring auth.
