import { parse, walkSync, TEXT_NODE, ELEMENT_NODE } from 'ultrahtml';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const pages = [
  '',
  'download',
  'guide',
  'manual',
  'faq',
  'effects',
  'formats',
  'workflow',
  'glossary',
];
const protectedNames = new Set([
  '日本語',
  'English',
  '繁體中文',
  '简体中文',
  '한국어',
  'MMD',
  'modoki',
  'MMD_modoki',
  '黒星紅白',
  '雨刻憩',
  '© dwango, inc. All rights reserved.',
]);
const source = {};
const context = {};
const record = (value, where) => {
  const text = value.trim().replace(/\s+/g, ' ');
  if (!text || !/[\p{L}]/u.test(text) || protectedNames.has(text)) return;
  const id = 'm' + createHash('sha256').update(text).digest('hex').slice(0, 12);
  if (source[id] && source[id] !== text) throw Error('Message collision');
  source[id] = text;
  (context[id] ??= []).push(where);
};
for (const page of pages) {
  const html = await readFile(path.join('dist', page, 'index.html'), 'utf8');
  walkSync(parse(html), (node, parent) => {
    if (node.type === TEXT_NODE) {
      let ancestor = parent;
      while (ancestor) {
        if (
          ['script', 'style', 'code', 'kbd'].includes(ancestor.name) ||
          ancestor.attributes?.['data-locale-switch'] !== undefined
        )
          return;
        ancestor = ancestor.parent;
      }
      record(node.value, `${page || 'home'}:${parent?.name}`);
    }
    if (node.type === ELEMENT_NODE) {
      for (const attr of [
        'alt',
        'title',
        'aria-label',
        'placeholder',
        'data-aliases',
        'data-count-template',
      ]) {
        if (node.attributes[attr])
          record(
            node.attributes[attr],
            `${page || 'home'}:${node.name}@${attr}`,
          );
      }
      if (
        node.name === 'meta' &&
        ['description', 'og:title', 'og:description'].includes(
          node.attributes.name ?? node.attributes.property,
        )
      )
        record(node.attributes.content, `${page || 'home'}:meta`);
    }
  });
}
if (process.argv.includes('--check')) {
  const existing = JSON.parse(await readFile('src/i18n/source.json', 'utf8'));
  if (JSON.stringify(existing) !== JSON.stringify(source)) {
    throw new Error(
      'Japanese source messages changed. Run npm run extract:i18n and translate every locale before publishing.',
    );
  }
  console.log(
    `PASS: ${Object.keys(source).length} source messages match the built Japanese pages`,
  );
  process.exit(0);
}
await mkdir('src/i18n', { recursive: true });
await mkdir('review', { recursive: true });
await writeFile('src/i18n/source.json', JSON.stringify(source, null, 2) + '\n');
await writeFile(
  'review/translation-context.json',
  JSON.stringify(context, null, 2) + '\n',
);
console.log(
  `Extracted ${Object.keys(source).length} unique text/attribute messages from ${pages.length} pages`,
);
