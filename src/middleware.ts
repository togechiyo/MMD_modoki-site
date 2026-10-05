import { defineMiddleware } from 'astro:middleware';
import {
  parse,
  renderSync,
  walkSync,
  TEXT_NODE,
  ELEMENT_NODE,
} from 'ultrahtml';
import source from './i18n/source.json';
import { localizedUrl, pages, routeInfo } from './i18n/config';

const catalogs = import.meta.glob<Record<string, string>>(
  './i18n/locales/*.json',
  { eager: true, import: 'default' },
);
const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');
const messageKeys = new Map(
  Object.entries(source).map(([key, value]) => [value, key]),
);
const escape = (value: string, attribute = false) => {
  const escaped = value
    .replace(/&(?!#\d+;|#x[\da-f]+;|[a-z][\da-z]+;)/gi, '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  return attribute ? escaped.replaceAll('"', '&quot;') : escaped;
};

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const base = import.meta.env.BASE_URL;
  const { locale } = routeInfo(context.url.pathname, base);
  if (
    locale === 'ja' ||
    !response.headers.get('content-type')?.includes('text/html')
  )
    return response;
  const catalog = catalogs[`./i18n/locales/${locale}.json`];
  if (!catalog) throw new Error(`Missing locale catalog: ${locale}`);
  const translate = (value: string, attribute = false) => {
    const normalized = normalize(value);
    const key = messageKeys.get(normalized);
    if (!key) return value;
    if (!catalog[key]?.trim())
      throw new Error(`Missing ${locale} translation ${key}: ${normalized}`);
    return value.replace(normalized === value ? value : value.trim(), () =>
      escape(catalog[key], attribute),
    );
  };
  const tree = parse(await response.text());
  walkSync(tree, (node, immediateParent) => {
    let parent = immediateParent;
    while (parent) {
      if (
        ['script', 'style', 'code', 'kbd'].includes(parent.name || '') ||
        parent.attributes?.['data-locale-switch'] !== undefined
      )
        return;
      parent = parent.parent;
    }
    if (node.type === TEXT_NODE) node.value = translate(node.value);
    if (node.type !== ELEMENT_NODE) return;
    if (node.name === 'html') node.attributes.lang = locale;
    if (node.attributes['data-locale-switch'] !== undefined) return;
    for (const attribute of [
      'alt',
      'title',
      'aria-label',
      'placeholder',
      'data-aliases',
      'data-count-template',
    ]) {
      if (node.attributes[attribute])
        node.attributes[attribute] = translate(
          node.attributes[attribute],
          true,
        );
    }
    if (
      node.name === 'meta' &&
      ['description', 'og:title', 'og:description'].includes(
        node.attributes.name || node.attributes.property,
      )
    ) {
      node.attributes.content = translate(node.attributes.content, true);
    }
    if (node.name === 'a' && node.attributes.href) {
      const url = new URL(node.attributes.href, context.url);
      if (
        url.origin === context.url.origin &&
        (url.pathname === base.replace(/\/$/, '') ||
          url.pathname.startsWith(base.replace(/\/$/, '') + '/'))
      ) {
        const target = routeInfo(url.pathname, base);
        if (
          target.locale === 'ja' &&
          pages.includes(target.slug as (typeof pages)[number])
        ) {
          node.attributes.href =
            localizedUrl(base, locale, target.slug) + url.search + url.hash;
        }
      }
    }
  });
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(renderSync(tree), { status: response.status, headers });
});
