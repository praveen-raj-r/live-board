# LiveBoard

A single-page, real-time collaborative Kanban board. One board, shared via URL — no accounts, no onboarding, no settings.

Built with Vite, React 18, TypeScript (strict), `@dnd-kit`, Tailwind CSS, TanStack Query, and Supabase (Postgres + Realtime).

See [`liveboard-spec.md`](./liveboard-spec.md) for the full project spec.

**Status:** Phases 1 and 2 are done (static board with full drag & drop, Supabase persistence, realtime sync, presence + live cursors). Phase 3 (final polish pass, deploy, demo recording) is in progress.

A full architecture writeup — sync strategy, conflict handling, tradeoffs — lands here once Phase 3 is complete.

## Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon/publishable key.

## Future Work

- **Multiple boards list / dashboard.** Explicitly out of scope for v1 (see `liveboard-spec.md` §5) — the app is one board per shareable URL, with no accounts to key a list off of. A "recently visited boards" list backed by localStorage would be the natural next step without requiring auth.
