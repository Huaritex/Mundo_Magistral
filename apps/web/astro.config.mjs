import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mundomagistral.bo',
  integrations: [sitemap()],
  output: 'static',
  trailingSlash: 'never',
  vite: {
    build: { assetsInlineLimit: 0 },
  },
});
