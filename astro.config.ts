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
      // Fuera del mapa: la 404 y el panel de edición.
      filter: (pagina) => !/^\/(404|admin)\b/.test(new URL(pagina).pathname),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // En `astro dev`, la API del panel la atiende el Worker de `npx wrangler dev` (puerto 8787).
    server: {
      proxy: { '/admin/api': 'http://localhost:8787' },
    },
  },
});
