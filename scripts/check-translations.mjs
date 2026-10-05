import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const source = JSON.parse(await readFile('src/i18n/source.json', 'utf8'));
for (const locale of ['en', 'zh-Hant', 'zh-Hans', 'ko']) {
  const catalog = JSON.parse(
    await readFile(`src/i18n/locales/${locale}.json`, 'utf8'),
  );
  const missing = Object.keys(source).filter((key) => !(key in catalog));
  const extra = Object.keys(catalog).filter((key) => !(key in source));
  assert.ok(
    !missing.length && !extra.length,
    `${locale}: missing ${missing.length} messages (${missing.slice(0, 5).join(', ')}), extra ${extra.length}`,
  );
  for (const [key, original] of Object.entries(source)) {
    assert.equal(
      typeof catalog[key],
      'string',
      `${locale}: ${key} must be text`,
    );
    assert.ok(catalog[key].trim(), `${locale}: empty ${key}`);
    assert.ok(
      !/[<>]/.test(catalog[key]),
      `${locale}: encode HTML brackets ${key}`,
    );
    for (const placeholder of original.match(/\{(?:shown|total)\}/g) || [])
      assert.ok(
        catalog[key].includes(placeholder),
        `${locale}: missing ${placeholder} in ${key}`,
      );
    if (
      /[ぁ-ゖァ-ヺ]/.test(original) ||
      (['en', 'ko'].includes(locale) && /\p{Script=Han}/u.test(original))
    )
      assert.notEqual(
        catalog[key],
        original,
        `${locale}: Japanese fallback ${key}`,
      );
  }
  console.log(
    `PASS: ${locale}: ${Object.keys(catalog).length} complete messages and search-count placeholders`,
  );
}
