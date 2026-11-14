# Development

## Requirements

- Node 22 (see `.nvmrc`; `fnm use` or `nvm use`).
- A Supabase project (hosted or local) for running the app.
- Docker, only for the end-to-end tests and for running Supabase locally.

## Setup

```bash
npm ci
cp .env.example .env.local   # then fill in the two values
npm run dev
```

### Environment variables

Names only; values never go in the repo. `.env*` files are git-ignored except `.env.example`.

| Name | Read in | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `src/lib/supabase.ts` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts` | Supabase anon / publishable key (shipped in the browser bundle; access is governed by RLS) |

The app throws at startup if either is missing. These are the only two variables the code reads.

## Supabase schema and migrations

The schema, RLS policies, replica identity and Realtime publication are in `supabase/migrations/0001_liveboard_schema.sql`.

- **Hosted project.** Run the file in the SQL editor, or link the project and use `npx supabase db push`. The file mirrors the project that is currently deployed; it was written from that project's catalogue, not from the original migration history. If your project already has the tables, do not re-run it blindly (`create policy` is not idempotent).
- **Local stack.** `npx supabase start` applies everything in `supabase/migrations/` to a fresh local database. `supabase/config.toml` enables only Postgres, PostgREST, Realtime and Auth (Auth is enabled because the CLI only prints the API keys when it is on). `npx supabase stop` shuts it down.
- To point the dev server at the local stack, put the `API_URL` and `ANON_KEY` from `npx supabase status -o env` into `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

What the RLS policies allow is documented in [decisions.md](decisions.md#what-anyone-can-do-read-write-delete).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b` then `vite build` |
| `npm run lint` | oxlint |
| `npm run typecheck` | `tsc -b` (app, plus the Node-side config, Playwright config and e2e specs) |
| `npm test` | Vitest, once (`src/**/*.test.{ts,tsx}`) |
| `npm run e2e` | Playwright against the local Supabase stack (see below) |
| `npm run size` | Prints the size of each file in `dist/assets`, raw and gzip (run `npm run build` first). Informational only |

## Tests

### Unit and integration

`npm test`. Vitest with happy-dom and Testing Library. No test touches the network: `src/test/fakes.ts` provides a fake Supabase query builder and a fake Realtime channel, and tests mock `src/lib/supabase`.

### End to end

Two browser contexts open the same board against a real local Supabase stack.

```bash
npx supabase start          # first run pulls Docker images
npx playwright install chromium
npm run e2e
```

`scripts/e2e.mjs` reads the API URL and anon key from `supabase status -o env`, passes them to the build as `VITE_SUPABASE_*`, and runs Playwright, which builds the app and serves it with `vite preview` on port 4173. The suite is in `e2e/board.spec.ts`. On failure, open the report with `npx playwright show-report` and traces with `npx playwright show-trace <trace.zip>`.

The e2e tests write boards into the local database; they do not clean up. `npx supabase db reset` restores a clean database.

### Windows note

Run `npm test` from PowerShell or cmd, not Git Bash. From Git Bash the repository path can resolve with a lowercase drive letter (`/d/...`), which makes Vitest load itself twice and every test file fail with "Vitest failed to find the current suite".

## CI

`.github/workflows/ci.yml`:

- `check` (pushes to `master`, all pull requests): `npm ci`, lint, typecheck, test, build (with placeholder Supabase env values), then the bundle size report. The size step never fails the job.
- `e2e` (pushes to `master` only): installs Chromium, starts local Supabase, runs `npm run e2e`, and uploads `playwright-report/` and `test-results/` if it fails.

Both jobs passed on GitHub on `master` on 2026-11-14.
