import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name),
      ),
    )
  ).flat();
}
const urls = new Set();
for (const file of (await walk('dist')).filter((f) => f.endsWith('.html'))) {
  const html = await readFile(file, 'utf8');
  for (const m of html.matchAll(/href="(https:\/\/github\.com\/[^\"]+)"/g))
    urls.add(m[1]);
}
const results = [];
const all = [...urls];
// Check pinned sources on raw.githubusercontent.com to avoid GitHub UI rate limits.
for (let i = 0; i < all.length; i += 4) {
  const batch = await Promise.all(
    all.slice(i, i + 4).map(async (url) => {
      const checkedUrl = url.replace(
        'https://github.com/togechiyo/MMD_modoki/blob/',
        'https://raw.githubusercontent.com/togechiyo/MMD_modoki/',
      );
      try {
        const r = await fetch(checkedUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(20000),
        });
        return { url, checkedUrl, status: r.status, ok: r.ok };
      } catch (e) {
        return { url, checkedUrl, ok: false, error: e.message };
      }
    }),
  );
  results.push(...batch);
}
await mkdir('review', { recursive: true });
await writeFile('review/external-links.json', JSON.stringify(results, null, 2));
for (const r of results)
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.status || r.error} ${r.url}`);
if (results.some((r) => !r.ok)) process.exitCode = 1;
