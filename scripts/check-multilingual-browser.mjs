import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const base =
  process.env.PREVIEW_URL || 'http://127.0.0.1:4321/MMD_modoki-site/';
const allLocales = ['ja', 'en', 'zh-Hant', 'zh-Hans', 'ko'];
const locales = process.env.CHECK_LOCALES
  ? process.env.CHECK_LOCALES.split(',')
  : allLocales;
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
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const failures = [],
  results = [];
await mkdir('review/screenshots', { recursive: true });
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
try {
  for (const [viewport, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
    ['small-mobile', 320, 740],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    page.on('pageerror', (error) => failures.push(error.message));
    for (const locale of locales) {
      const prefix = locale === 'ja' ? '' : `${locale}/`;
      for (const slug of pages) {
        const target = base + prefix + (slug ? slug + '/' : '');
        const response = await page.goto(target);
        check(
          response?.status() === 200,
          `${target}: HTTP ${response?.status()}`,
        );
        await page.addScriptTag({
          path: require.resolve('axe-core/axe.min.js'),
        });
        const report = await page.evaluate(async () => ({
          lang: document.documentElement.lang,
          overflow: document.documentElement.scrollWidth > innerWidth,
          headings: document.querySelectorAll('h1').length,
          switches: document.querySelectorAll('[data-locale-switch]').length,
          current: document
            .querySelector('[data-locale-switch][aria-current="true"]')
            ?.getAttribute('data-locale-switch'),
          accessibility: (
            await window.axe.run(document, {
              runOnly: {
                type: 'tag',
                values: ['wcag2a', 'wcag2aa', 'wcag21aa'],
              },
            })
          ).violations.map((v) => ({
            id: v.id,
            targets: v.nodes.map((n) => n.target),
          })),
        }));
        check(
          report.lang === locale &&
            report.headings === 1 &&
            report.switches === 5 &&
            report.current === locale,
          `${viewport} ${locale}/${slug}: semantics ${JSON.stringify(report)}`,
        );
        check(
          !report.overflow,
          `${viewport} ${locale}/${slug}: horizontal overflow`,
        );
        check(
          !report.accessibility.length,
          `${viewport} ${locale}/${slug}: axe ${JSON.stringify(report.accessibility)}`,
        );
        if (slug === 'effects') {
          const cards = page.locator('[data-effect-card]:visible');
          check((await cards.count()) === 20, `${locale}: 20 effects`);
          const localizedBloom = (
            await page.locator('#bloom h3').textContent()
          ).trim();
          await page.locator('#effect-query').fill(localizedBloom);
          check(
            await page.locator('#bloom').isVisible(),
            `${locale}: localized effect-name search`,
          );
          await page.locator('#effect-query').fill('SSR');
          check(
            await page.locator('#ssr').isVisible(),
            `${locale}: SSR search`,
          );
          await page.locator('#effect-query').fill('no-such-effect-123');
          check(
            (await cards.count()) === 0 &&
              (await page.locator('#effect-empty').isVisible()),
            `${locale}: effect empty`,
          );
          await page.locator('#effect-query').fill('');
          check((await cards.count()) === 20, `${locale}: effect reset`);
        }
        if (slug === 'glossary') {
          const cards = page.locator('[data-term-card]:visible');
          check((await cards.count()) === 32, `${locale}: 32 glossary terms`);
          const localizedTerm = (
            await page.locator('#camera-distance h3').textContent()
          ).trim();
          await page.locator('#term-query').fill(localizedTerm);
          check(
            await page.locator('#camera-distance').isVisible(),
            `${locale}: localized glossary-title search`,
          );
          await page.locator('#term-query').fill('D');
          check(
            (await page.locator('#camera-distance').isVisible()) &&
              !(await page.locator('#bone-rotation').isVisible()),
            `${locale}: exact D alias`,
          );
          await page.locator('#term-query').fill('no-such-term-123');
          check(
            (await cards.count()) === 0 &&
              (await page.locator('#term-empty').isVisible()),
            `${locale}: glossary empty`,
          );
          await page.locator('#term-reset').click();
          check((await cards.count()) === 32, `${locale}: glossary reset`);
          await page.locator('#term-category').selectOption('accessory');
          check((await cards.count()) === 5, `${locale}: accessory category`);
          await page.locator('#term-query').fill('Si');
          check(
            await page.locator('#accessory-scale').isVisible(),
            `${locale}: combined category/alias`,
          );
          await page.locator('#term-reset').click();
          await page.locator('#term-query').focus();
          await page.locator('#term-category').selectOption('camera');
          await page
            .locator(
              '#camera-distance .term-related a[href$="#input-precision"]',
            )
            .click();
          check(
            (await cards.count()) === 32 &&
              (await page.locator('#input-precision').isVisible()),
            `${locale}: cross-category link resets filter`,
          );
          await page.locator('#term-query').focus();
          await page.keyboard.type('FoV');
          await page.keyboard.press('Tab');
          check(
            (await page.locator(':focus').getAttribute('id')) ===
              'term-category',
            `${locale}: keyboard category focus`,
          );
          await page.keyboard.press('Tab');
          await page.keyboard.press('Enter');
          check((await cards.count()) === 32, `${locale}: keyboard reset`);
          await page.goto(target + '#camera-distance');
          for (const other of allLocales) {
            const link = page.locator(`[data-locale-switch="${other}"]`);
            check(
              (await link.getAttribute('href')).endsWith(
                'glossary/#camera-distance',
              ),
              `${locale}->${other}: retained page/anchor`,
            );
          }
        }
        if (slug === 'faq') {
          await page.goto(target + '#silent-output');
          check(
            await page.locator('#silent-output').evaluate((el) => el.open),
            `${locale}: FAQ anchor`,
          );
        }
        await page.goto(target);
        const broken = await page.locator('img').evaluateAll(async (images) => {
          await Promise.all(
            images.map((img) => img.decode().catch(() => undefined)),
          );
          return images.filter((img) => !img.complete || !img.naturalWidth)
            .length;
        });
        check(!broken, `${locale}/${slug}: broken images`);
        if (viewport === 'mobile' && ['', 'glossary'].includes(slug)) {
          await page.screenshot({
            path: `review/screenshots/multilang-${locale}-${slug || 'home'}-mobile.png`,
            fullPage: false,
          });
        }
        results.push({ viewport, locale, page: slug || 'home', ...report });
      }
      await page.goto(base + prefix);
      await page.keyboard.press('Tab');
      check(
        (await page.locator(':focus').getAttribute('class')) === 'skip-link',
        `${locale}: skip link first`,
      );
      await page.keyboard.press('Enter');
      check(page.url().endsWith('#main'), `${locale}: skip link target`);
      console.log(`Checked ${viewport}: ${locale}: 9 pages`);
    }
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const locale of locales) {
    await page.goto(base + (locale === 'ja' ? '' : locale + '/') + 'glossary/');
    check(
      (await page.locator('[data-term-card]:visible').count()) === 32 &&
        !(await page.locator('#glossary-search').isVisible()),
      `${locale}: glossary without JavaScript`,
    );
  }
  await context.close();
} finally {
  await browser.close();
}
await writeFile(
  'review/multilingual-browser-results.json',
  JSON.stringify(
    {
      browser:
        'Microsoft Edge on user PC, headless, isolated temporary profile',
      base,
      results,
      failures,
    },
    null,
    2,
  ),
);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `PASS: ${results.length} page/viewport combinations; five-language search, reset, anchors, keyboard, WCAG axe, images and no-JavaScript glossary`,
  );
