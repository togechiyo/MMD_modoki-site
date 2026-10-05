import { readFile } from 'node:fs/promises';
import { parse, walkSync, TEXT_NODE, ELEMENT_NODE } from 'ultrahtml';
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
const failures = [];
const check = (text, locale, where) => {
  const content = text.replace(
    /ニコニ立体ちゃん|アリシア・ソリッド|センター|黒星紅白|雨刻憩/g,
    '',
  );
  if (
    /[ぁ-ゖァ-ヺ]/.test(content) ||
    (['en', 'ko'].includes(locale) && /\p{Script=Han}/u.test(content))
  )
    failures.push(
      `${locale}/${where}: unexpected Japanese text ${text.slice(0, 100)}`,
    );
};
for (const locale of ['en', 'zh-Hant', 'zh-Hans', 'ko']) {
  for (const page of pages) {
    const html = await readFile(
      `dist/${locale}/${page ? page + '/' : ''}index.html`,
      'utf8',
    );
    walkSync(parse(html), (node, parent) => {
      let ancestor = parent;
      while (ancestor) {
        if (
          ['script', 'style', 'code', 'kbd'].includes(ancestor.name) ||
          ancestor.attributes?.['data-locale-switch'] !== undefined
        )
          return;
        ancestor = ancestor.parent;
      }
      if (node.type === TEXT_NODE) check(node.value, locale, page || 'home');
      if (
        node.type === ELEMENT_NODE &&
        node.attributes['data-locale-switch'] === undefined
      ) {
        for (const attribute of [
          'alt',
          'title',
          'aria-label',
          'placeholder',
          'data-aliases',
          'data-count-template',
        ])
          if (node.attributes[attribute])
            check(
              node.attributes[attribute],
              locale,
              `${page || 'home'}@${attribute}`,
            );
        if (
          node.name === 'meta' &&
          ['description', 'og:title', 'og:description'].includes(
            node.attributes.name || node.attributes.property,
          )
        )
          check(node.attributes.content, locale, `${page || 'home'}@meta`);
      }
    });
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    'PASS: 36 translated HTML pages, including SEO, aliases and accessible labels; only original model/bone names, authors, code and native language choices retain Japanese',
  );
