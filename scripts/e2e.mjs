// Runs the Playwright suite against the local Supabase stack (`npx supabase start`).
// Reads the stack's API URL and anon key from `supabase status` so no secrets live in the repo.
import { spawnSync } from 'node:child_process';

const status = spawnSync('npx', ['supabase', 'status', '-o', 'env'], { encoding: 'utf8', shell: true });
if (status.status !== 0) {
  console.error('Could not read `supabase status`. Is the local stack running? Try: npx supabase start');
  console.error(status.stderr);
  process.exit(1);
}

const env = Object.fromEntries(
  status.stdout
    .split('\n')
    .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);

const url = env.API_URL ?? env.SUPABASE_URL;
const anon = env.ANON_KEY ?? env.PUBLISHABLE_KEY ?? env.SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error('Missing API URL / anon key in `supabase status -o env` output. Keys found:', Object.keys(env).join(', '));
  process.exit(1);
}

const run = spawnSync('npx', ['playwright', 'test', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: anon },
});
process.exit(run.status ?? 1);
