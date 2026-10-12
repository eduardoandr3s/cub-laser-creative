/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Usa la configuración de Vite de Astro para que los módulos que importan
// `astro:content` o `astro/zod` se puedan cargar en los tests.
export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
