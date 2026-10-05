import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const base =
  process.env.PREVIEW_URL || 'http://127.0.0.1:4321/MMD_modoki-site/';
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'msedge',
  headless: true,
});
const results = [];
const failures = [];
await mkdir('review/screenshots', { recursive: true });
try {
  for (const [name, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
    ['small-mobile', 320, 740],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => failures.push(`${name}: ${error.message}`));
    for (const slug of [
      '',
      'download/',
      'guide/',
      'manual/',
      'faq/',
      'effects/',
      'formats/',
      'workflow/',
      'glossary/',
    ]) {
      const response = await page.goto(base + slug, {
        waitUntil: 'networkidle',
      });
      if (response?.status() !== 200)
        failures.push(`${name} ${slug}: HTTP ${response?.status()}`);
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const accessibility = await page.evaluate(async () => {
        const result = await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
        });
        return result.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          targets: v.nodes.map((n) => n.target),
        }));
      });
      if (accessibility.length)
        failures.push(
          `${name} ${slug}: accessibility ${JSON.stringify(accessibility)}`,
        );
      const report = await page.evaluate(() => ({
        title: document.title,
        width: innerWidth,
        contentWidth: document.documentElement.scrollWidth,
        headings: document.querySelectorAll('h1').length,
        navLinks: document.querySelectorAll(
          'nav[aria-label="メインナビゲーション"] a',
        ).length,
        active: document.querySelectorAll(
          'nav[aria-label="メインナビゲーション"] a[aria-current="page"]',
        ).length,
        lang: document.documentElement.lang,
        links: [...document.querySelectorAll('nav a')].map((a) =>
          a.getAttribute('href'),
        ),
      }));
      if (report.contentWidth > width)
        failures.push(
          `${name} ${slug}: horizontal overflow ${report.contentWidth}>${width}`,
        );
      if (
        report.headings !== 1 ||
        report.navLinks !== 5 ||
        report.active !==
          (['effects/', 'formats/', 'workflow/', 'glossary/'].includes(slug)
            ? 0
            : 1) ||
        report.lang !== 'ja'
      )
        failures.push(`${name} ${slug}: semantics ${JSON.stringify(report)}`);
      for (const href of report.links) {
        const r = await context.request.get(new URL(href, base).href);
        if (r.status() !== 200)
          failures.push(
            `${name} ${slug}: navigation ${href} HTTP ${r.status()}`,
          );
      }
      if (slug === 'effects/') {
        const cards = page.locator('[data-effect-card]:visible');
        if ((await cards.count()) !== 20)
          failures.push(`${name}: expected 20 effects`);
        await page.locator('#effect-query').fill('反射');
        if (
          (await cards.count()) !== 1 ||
          !(await page.locator('#ssr').isVisible())
        )
          failures.push(`${name}: effect search reflection failed`);
        await page.locator('#effect-query').fill('no-such-effect-123');
        if (
          !(await page.locator('#effect-empty').isVisible()) ||
          (await cards.count()) !== 0
        )
          failures.push(`${name}: effect empty state failed`);
        await page.locator('#effect-query').fill('');
        if ((await cards.count()) !== 20)
          failures.push(`${name}: effect search reset failed`);
      }
      if (slug === '') {
        if (
          (await page.locator('.hero-art').count()) !== 0 ||
          (await page.locator('.hero-app .app-screenshot img').count()) !== 1 ||
          (await page.locator('.app-screenshot').count()) !== 1 ||
          !(await page.locator('.hero-app img').isVisible())
        )
          failures.push(`${name}: home must show one actual app screenshot`);
      }
      if (slug === 'glossary/') {
        const cards = page.locator('[data-term-card]:visible');
        if ((await cards.count()) !== 32)
          failures.push(`${name}: dictionary initial count`);
        await page.locator('#term-query').fill('位置Ｚ');
        if (!(await page.locator('#camera-target').isVisible()))
          failures.push(`${name}: dictionary normalized alias search`);
        await page.locator('#term-query').fill('no-such-term-123');
        if (
          (await cards.count()) !== 0 ||
          !(await page.locator('#term-empty').isVisible())
        )
          failures.push(`${name}: dictionary empty state`);
        await page.getByRole('button', { name: '絞り込みをリセット' }).click();
        if ((await cards.count()) !== 32)
          failures.push(`${name}: dictionary reset`);
        await page.locator('#term-category').selectOption('accessory');
        if ((await cards.count()) !== 5)
          failures.push(`${name}: dictionary category`);
        await page.locator('#term-query').fill('Si');
        if (!(await page.locator('#accessory-scale').isVisible()))
          failures.push(`${name}: dictionary combined filter`);
        await page.getByRole('button', { name: '絞り込みをリセット' }).click();
        await page
          .getByRole('navigation', { name: '辞典のカテゴリ' })
          .getByRole('link', { name: 'カメラ・視点' })
          .click();
        if ((await cards.count()) !== 6)
          failures.push(`${name}: dictionary category anchor`);
        await page
          .locator('#camera-distance .term-related')
          .getByRole('link', { name: '表示桁・step・入力範囲' })
          .click();
        if (
          !(await page.locator('#input-precision').isVisible()) ||
          (await cards.count()) !== 32
        )
          failures.push(`${name}: dictionary cross-category link`);
        await page.goto(base + 'glossary/#camera-distance');
        if (!(await page.locator('#camera-distance').isVisible()))
          failures.push(`${name}: dictionary direct anchor`);
        await page.locator('#term-query').focus();
        await page.keyboard.type('FoV');
        await page.keyboard.press('Tab');
        if (
          (await page.locator(':focus').getAttribute('id')) !== 'term-category'
        )
          failures.push(`${name}: dictionary keyboard focus`);
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');
        if ((await cards.count()) !== 32)
          failures.push(`${name}: dictionary keyboard reset`);
        await page.goto(base + 'glossary/');
      }
      const brokenImages = await page
        .locator('img')
        .evaluateAll(async (images) => {
          await Promise.all(
            images.map((img) => img.decode().catch(() => undefined)),
          );
          return images
            .filter((img) => !img.complete || img.naturalWidth === 0)
            .map((img) => img.src);
        });
      if (brokenImages.length)
        failures.push(`${name} ${slug}: images ${brokenImages.join(', ')}`);
      await page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement)
          document.activeElement.blur();
        window.scrollTo(0, 0);
      });
      if (name !== 'small-mobile')
        await page.screenshot({
          path: `review/screenshots/${name}-${slug.replace('/', '') || 'home'}.png`,
          fullPage: slug !== 'glossary/',
        });
      if (slug === 'faq/') {
        const detail = page.locator('details').nth(1);
        await detail.locator('summary').click();
        if (
          !(await detail.getAttribute('open')) &&
          !(await detail.evaluate((el) => el.open))
        )
          failures.push(`${name}: FAQ did not expand`);
        await page.goto(base + 'faq/#silent-output');
        if (!(await page.locator('#silent-output').evaluate((el) => el.open)))
          failures.push(`${name}: FAQ deep link did not expand`);
      }
      results.push({
        viewport: name,
        page: slug || 'home',
        accessibility,
        ...report,
      });
    }
    await page.goto(base + 'guide/');
    await page
      .getByRole('link', {
        name: '保存形式を選ぶ 作業再開・動きの交換・完成品',
      })
      .click();
    if (!page.url().endsWith('/formats/'))
      failures.push(name + ': beginner to formats failed');
    await page
      .getByRole('link', {
        name: '動画編集ソフトで合成したい 連番PNG＋音声を別途',
      })
      .click();
    if (!page.url().endsWith('#sequence'))
      failures.push(name + ': purpose anchor failed');
    await page.getByRole('link', { name: '制作の流れに沿って使う →' }).click();
    if (!page.url().endsWith('/workflow/'))
      failures.push(name + ': formats to workflow failed');
    await page
      .getByRole('link', { name: '小さく出力確認', exact: true })
      .click();
    if (!page.url().endsWith('#test-export'))
      failures.push(name + ': workflow export anchor failed');
    await page
      .getByRole('navigation', { name: '使い方ガイド' })
      .getByRole('link', { name: 'エフェクト', exact: true })
      .click();
    await page
      .getByRole('link', { name: '20種類を検索・一覧から探す →' })
      .click();
    if (!page.url().endsWith('#effect-search'))
      failures.push(name + ': early search entry failed');
    for (const id of ['light', 'space', 'camera', 'finish'])
      if (!(await page.locator('#' + id + ' > h2').count()))
        failures.push(name + ': missing category heading ' + id);
    await page.goto(base);
    await page.keyboard.press('Tab');
    if ((await page.locator(':focus').textContent()) !== '本文へ移動')
      failures.push(`${name}: skip link not first focus`);
    await page.keyboard.press('Enter');
    if (!page.url().endsWith('#main'))
      failures.push(`${name}: skip link target failed`);
    await page.goto(base + 'manual/');
    await page
      .getByRole('link', { name: 'DとZ・視野角の意味を調べる ↗' })
      .click();
    if (
      !page.url().endsWith('/glossary/#camera-distance') ||
      !(await page.locator('#camera-distance').isVisible())
    )
      failures.push(`${name}: manual to dictionary`);
    await context.close();
  }
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.goto(base + 'glossary/');
  if (
    (await staticPage.locator('[data-term-card]:visible').count()) !== 32 ||
    (await staticPage.locator('#glossary-search').isVisible())
  )
    failures.push('dictionary without JavaScript');
  await noJs.close();
} finally {
  await browser.close();
}
await writeFile(
  'review/browser-results.json',
  JSON.stringify(
    {
      browser:
        'Microsoft Edge installed on user PC, headless, isolated temporary profile',
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
    `PASS: ${results.length} page/viewport combinations, navigation, no horizontal overflow, FAQ, dictionary filters/anchors/keyboard; 18 screenshots in review/screenshots`,
  );
