import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(process.env.DIST_DIR || 'dist');
const base = (process.env.SITE_BASE || '/MMD_modoki-site').replace(/\/$/, '');
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
const files = (await walk(root)).filter((f) => f.endsWith('.html'));
let checked = 0;
const errors = [];
for (const file of files) {
  const html = await readFile(file, 'utf8');
  const pagePath =
    '/' +
    path
      .relative(root, file)
      .replaceAll('\\', '/')
      .replace(/index\.html$/, '');
  const pageUrl = new URL(base + pagePath, 'http://localhost');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = match[1].replaceAll('&amp;', '&');
    if (/^(https?:|mailto:|data:)/.test(raw)) continue;
    const link = new URL(raw, pageUrl);
    if (!(link.pathname === base || link.pathname.startsWith(base + '/'))) {
      errors.push(`${pagePath}: outside project base: ${raw}`);
      continue;
    }
    const relative = decodeURIComponent(link.pathname.slice(base.length));
    let target = path.join(root, relative);
    try {
      if ((await stat(target)).isDirectory())
        target = path.join(target, 'index.html');
      await stat(target);
      if (link.hash) {
        const contents = await readFile(target, 'utf8');
        if (
          !contents.includes(`id="${decodeURIComponent(link.hash.slice(1))}"`)
        )
          errors.push(`${pagePath}: missing anchor ${raw}`);
      }
      checked++;
    } catch {
      errors.push(`${pagePath}: missing ${raw}`);
    }
  }
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1)
    errors.push(`${pagePath}: expected one h1`);
  const expectedLocale = pagePath.split('/')[1];
  const locale = ['en', 'zh-Hant', 'zh-Hans', 'ko'].includes(expectedLocale)
    ? expectedLocale
    : 'ja';
  if (!html.includes(`<html lang="${locale}"`))
    errors.push(`${pagePath}: incorrect document language ${locale}`);
  if ((html.match(/rel="alternate" hreflang=/g) || []).length !== 6)
    errors.push(`${pagePath}: expected five language alternates and x-default`);
  const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical || new URL(canonical).pathname !== base + pagePath)
    errors.push(`${pagePath}: incorrect canonical ${canonical}`);
  const slug =
    locale === 'ja' ? pagePath.slice(1) : pagePath.slice(locale.length + 2);
  for (const language of [
    'ja',
    'en',
    'zh-Hant',
    'zh-Hans',
    'ko',
    'x-default',
  ]) {
    const alternate = html.match(
      new RegExp(`rel="alternate" hreflang="${language}" href="([^"]+)"`),
    )?.[1];
    const expected =
      base +
      '/' +
      (['ja', 'x-default'].includes(language) ? '' : language + '/') +
      slug;
    if (!alternate || new URL(alternate).pathname !== expected)
      errors.push(`${pagePath}: incorrect ${language} alternate ${alternate}`);
  }
}
if (files.length !== 45) errors.push(`Expected 45 pages; got ${files.length}`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `PASS: ${files.length} pages, ${checked} internal links/assets/anchors; project base ${base}`,
  );
