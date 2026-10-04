import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://togechiyo.github.io',
  base: process.env.SITE_BASE || '/MMD_modoki-site',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
