// Prints the size of every file in dist/assets (raw and gzip). Informational only: never fails the build.
import { readdirSync, readFileSync, appendFileSync, existsSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const dir = 'dist/assets';
if (!existsSync(dir)) {
  console.log('dist/assets not found. Run `npm run build` first.');
  process.exit(0);
}

const kb = (n) => (n / 1024).toFixed(2).padStart(9) + ' kB';
const rows = readdirSync(dir)
  .filter((f) => statSync(join(dir, f)).isFile())
  .map((f) => {
    const buf = readFileSync(join(dir, f));
    return { file: f, raw: buf.length, gzip: gzipSync(buf).length };
  })
  .sort((a, b) => b.raw - a.raw);

const total = rows.reduce((t, r) => ({ raw: t.raw + r.raw, gzip: t.gzip + r.gzip }), { raw: 0, gzip: 0 });

const lines = ['file'.padEnd(40) + '      raw       gzip'];
for (const r of rows) lines.push(r.file.padEnd(40) + kb(r.raw) + kb(r.gzip));
lines.push('TOTAL'.padEnd(40) + kb(total.raw) + kb(total.gzip));
console.log(lines.join('\n'));

if (process.env.GITHUB_STEP_SUMMARY) {
  const md = [
    '### Bundle size',
    '| file | raw | gzip |',
    '|---|---:|---:|',
    ...rows.map((r) => `| ${r.file} | ${(r.raw / 1024).toFixed(2)} kB | ${(r.gzip / 1024).toFixed(2)} kB |`),
    `| **total** | **${(total.raw / 1024).toFixed(2)} kB** | **${(total.gzip / 1024).toFixed(2)} kB** |`,
    '',
  ].join('\n');
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
}
