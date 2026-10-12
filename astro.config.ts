import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { negocio } from './src/config/negocio';

// https://astro.build/config
export default defineConfig({
  site: negocio.url,
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      filter: (pagina) => !new URL(pagina).pathname.startsWith('/404'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
