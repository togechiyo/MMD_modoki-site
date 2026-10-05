export const languages = [
  { locale: 'ja', label: '日本語' },
  { locale: 'en', label: 'English' },
  { locale: 'zh-Hant', label: '繁體中文' },
  { locale: 'zh-Hans', label: '简体中文' },
  { locale: 'ko', label: '한국어' },
] as const;
export type Locale = (typeof languages)[number]['locale'];
export const pages = [
  '',
  'download',
  'guide',
  'manual',
  'faq',
  'effects',
  'formats',
  'workflow',
  'glossary',
] as const;
export function routeInfo(pathname: string, base: string) {
  const pieces = pathname
    .slice(base.replace(/\/$/, '').length)
    .split('/')
    .filter(Boolean);
  const matched = languages.find(
    (item) => item.locale !== 'ja' && item.locale === pieces[0],
  );
  return {
    locale: matched?.locale ?? ('ja' as Locale),
    slug: (matched ? pieces.slice(1) : pieces).join('/'),
  };
}
export function localizedUrl(base: string, locale: Locale, slug = '') {
  return `${base.replace(/\/$/, '')}/${locale === 'ja' ? '' : locale + '/'}${slug ? slug.replace(/^\//, '').replace(/\/$/, '') + '/' : ''}`;
}
