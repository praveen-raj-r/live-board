# LiveBoard

A single-page, real-time collaborative Kanban board. One board, shared via URL — no accounts, no onboarding, no settings.

Built with Vite, React 18, TypeScript (strict), `@dnd-kit`, Tailwind CSS, TanStack Query, and Supabase (Postgres + Realtime).

See [`liveboard-spec.md`](./liveboard-spec.md) for the full project spec.

**Status:** Phase 1 (static board, full drag & drop) is done. Phase 2 (Supabase persistence, realtime sync, presence) is in progress.

A full architecture writeup — sync strategy, conflict handling, tradeoffs — lands here once Phase 2/3 are complete.

## Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon/publishable key.
