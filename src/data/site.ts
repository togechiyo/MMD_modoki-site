export const repository = 'https://github.com/togechiyo/MMD_modoki';
export const sourceCommit = '0bb3116d113a122de43c2d72ee3f4b8412e6e004';
export const source = (path: string) =>
  `${repository}/blob/${sourceCommit}/${path}`;
export const release = {
  tag: 'v0.2.4',
  published: '2026-09-18',
  checked: '2026-10-02',
  prerelease: true,
  stable: null,
  url: `${repository}/releases/tag/v0.2.4`,
  downloads: [
    {
      os: 'Windows',
      arch: 'x64',
      format: 'ZIP',
      file: 'MMD.modoki-windows-x64-0.2.4.zip',
    },
    {
      os: 'macOS',
      arch: 'Releaseの説明を確認',
      format: 'ZIP',
      file: 'MMD.modoki-mac-0.2.4.zip',
    },
    {
      os: 'macOS',
      arch: 'Apple Silicon / arm64',
      format: 'DMG',
      file: 'MMD.modoki-mac-arm64-0.2.4.dmg',
    },
    {
      os: 'Linux',
      arch: 'x64',
      format: 'ZIP',
      file: 'MMD.modoki-linux-x64-0.2.4.zip',
    },
  ],
};
export const locales = {
  ja: {
    label: '日本語',
    nav: [
      { slug: '', label: 'トップ' },
      { slug: 'download', label: 'ダウンロード' },
      { slug: 'guide', label: 'はじめての使い方' },
      { slug: 'manual', label: '操作マニュアル' },
      { slug: 'faq', label: 'FAQ' },
    ],
  },
};
export const url = (slug = '') =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${slug ? slug.replace(/^\//, '').replace(/\/$/, '') + '/' : ''}`;
