# Tasks

## 1. Preparación del proyecto

- [x] 1.1 Crear el proyecto Astro 7 con la plantilla mínima y TypeScript estricto en la raíz del repositorio, sin sobrescribir `openspec/` ni `.claude/`; añadir `.nvmrc` con `22` y completar `.gitignore` (`node_modules`, `dist`, `.astro`). Verificar que `npm run dev` arranca y sirve `/`
- [x] 1.2 Instalar `tailwindcss`, `@tailwindcss/vite`, `@astrojs/sitemap`, `@astro-community/astro-embed-youtube`, `@lucide/astro` y `@fontsource-variable/plus-jakarta-sans`, y en desarrollo `vitest`, `@astrojs/check` y `typescript@^6`. Verificar que `npm ls` no muestra errores de dependencias ni peers incompatibles _(`astro-embed-youtube` se desinstaló en la 5.5: ver la decisión 8 del diseño)_
- [x] 1.3 Crear `astro.config.ts` con `site` importado de `negocio.url`, `trailingSlash: 'always'`, `build.format: 'directory'`, el plugin Vite de Tailwind y la integración de sitemap filtrando la 404. Añadir los scripts `dev`, `build`, `preview`, `check`, `test` y `verify` (check + test + build). Verificar que `npm run build` genera `dist/`

## 2. Lógica pura con tests

- [x] 2.1 Implementar `src/lib/whatsapp.ts` (`enlaceWhatsApp`, `mensajeTrabajo`). Verificar con tests de Vitest: codificación de `¿`, `ñ`, acentos, espacios y saltos de línea, y que el mensaje de un trabajo contiene su título y su URL absoluta
- [x] 2.2 Implementar `src/lib/youtube.ts` (`parseYouTube`). Verificar con tests: `watch?v=` (incluso con parámetros extra como `&t=30s`), `youtu.be/`, `embed/`, `shorts/` (→ `vertical: true`), id suelto de 11 caracteres y rechazo de enlaces de Vimeo o ids mal formados
- [x] 2.3 Implementar las funciones puras `ordenarPorFecha`, `seleccionarDestacados` y `seleccionarRelacionados` en `src/lib/trabajos.ts`. Verificar con tests: máximo 6 destacados, sustitución por los 6 más recientes si no hay marcados, relacionados de la misma categoría excluyendo el actual (máximo 3) y lista vacía cuando no hay otros
- [x] 2.4 Implementar `src/lib/jsonld.ts` (`localBusiness`). Verificar con tests que incluye nombre, URL, teléfono, dirección en Valencia (ES) y `areaServed`, y que `sameAs` solo contiene las redes configuradas

## 3. Configuración y modelo de contenido

- [x] 3.1 Crear `src/config/negocio.ts` con el schema Zod y una función `validarNegocio(datos, { prod })`: número de WhatsApp `^[1-9]\d{7,14}$` (error en producción, aviso en desarrollo) y aviso con los campos legales ausentes. Verificar con tests de Vitest ambos modos y el aviso de un NIF ausente
- [x] 3.2 Crear `src/config/inicio.ts` con el titular del hero, los diferenciales (corte láser de precisión 20W, impresión a todo color sobre madera real, diseños a medida, pedidos para eventos y empresas) y los pasos de pedido (idea por WhatsApp → boceto → aprobación y producción → entrega), con iconos validados contra un mapa cerrado de iconos Lucide. Verificar que `npm run check` falla con un nombre de icono inexistente y pasa con los válidos
- [x] 3.3 Crear `src/content.config.ts` con las colecciones `categorias` (`*.yml`) y `trabajos` (`*/index.md`, `generateId` = nombre de carpeta, `reference('categorias')`, `image()`, `descripcion` ≤ 160, `videos` transformados con `parseYouTube`). Verificar con pruebas temporales que el build falla nombrando el archivo y el campo con: categoría inexistente, portada ausente y enlace de Vimeo; después, revertir las pruebas
- [x] 3.4 Añadir `getTrabajosPublicados()` en `src/lib/trabajos.ts` (filtra borradores en producción y ordena por fecha). Verificar en la tarea 3.6
- [x] 3.5 Crear las categorías iniciales `llaveros`, `placas`, `marcos`, `eventos` y `empresas` con `nombre` y `orden`. Verificar que `npm run build` las acepta
- [x] 3.6 Generar fotos provisionales con la marca (texto "Foto provisional") y crear 5 trabajos de ejemplo que cubran: varias fotos, solo portada, uno destacado, uno con video horizontal, uno con un Short vertical (videos públicos de ejemplo, a sustituir) y uno en borrador. Verificar que el borrador aparece en `npm run dev` y no existe en `dist/` tras `npm run build`

## 4. Identidad visual

- [x] 4.1 Crear `src/styles/global.css` con `@import "tailwindcss"`, los tokens `@theme` de la decisión 9 del diseño, la fuente Plus Jakarta Sans, estilos de foco visibles y la franja de degradado CMYK reutilizable. Verificar con una calculadora de contraste que todas las combinaciones usadas cumplen WCAG AA
- [x] 4.2 Crear `src/components/Logo.astro` (C en `tinta`, UB con degradado cian → magenta → ámbar, subtítulo oculto en pantallas estrechas) y los SVG de marca de WhatsApp, Instagram, TikTok y Facebook en `src/components/iconos/`. Verificar visualmente en `npm run dev` a 320 px y en escritorio
- [x] 4.3 Generar `public/favicon.svg` y `public/og-default.png` (1200×630) con la marca. Verificar que ambos archivos se sirven en `npm run preview`

## 5. Layout y componentes comunes

- [x] 5.1 Crear `src/components/SEO.astro` (título según las reglas de la spec, descripción, canónica absoluta, Open Graph y Twitter). Verificar en el HTML generado de inicio y de una ficha
- [x] 5.2 Crear `src/components/BotonWhatsApp.astro` y `src/components/WhatsAppFlotante.astro` (verde `#25D366` con icono en `tinta`, mínimo 44×44 px, `aria-label` "Escribir por WhatsApp", `target="_blank" rel="noopener"`, estado deshabilitado sin número en desarrollo). Verificar que los enlaces generados abren WhatsApp con el mensaje correcto
- [x] 5.3 Crear `src/layouts/BaseLayout.astro`: `lang="es"`, enlace "Saltar al contenido", cabecera con `Logo` y navegación con `aria-current`, `<main id="contenido">`, pie (ubicación, WhatsApp, redes configuradas, aviso legal, privacidad y año) con espacio inferior para el botón flotante, y `WhatsAppFlotante` con el mensaje recibido por props. Verificar recorriendo una página solo con el teclado
- [x] 5.4 Crear `src/components/TarjetaTrabajo.astro` y `src/components/GrillaTrabajos.astro` (`<Picture>` AVIF/WebP, título, categoría, indicador "Incluye video" accesible, tarjeta entera enlazada, carga `eager` en las 3 primeras). Verificar en la galería de ejemplo
- [x] 5.5 Crear `src/components/VideoYouTube.astro` como facade propia (plan B; `<YouTube>` de astro-embed se descartó porque en móviles y Safari reproduce desde `www.youtube.com`), con contenedor 9:16 para los Shorts. Verificar en el navegador que antes de pulsar no hay iframe ni scripts de YouTube, que al pulsar se carga desde `youtube-nocookie.com` y que el Short se ve en vertical (si el CSS de `lite-youtube` lo impide, aplicar el plan B del diseño)

## 6. Páginas

- [x] 6.1 Crear `src/pages/index.astro` con `Hero`, `Diferenciales`, `Destacados`, `ComoEncargar` y `CtaWhatsApp` leyendo `src/config/inicio.ts`, más el JSON-LD `LocalBusiness`. Verificar que añadir un paso en `inicio.ts` lo muestra sin tocar componentes
- [x] 6.2 Crear `src/pages/trabajos/index.astro` con `FiltroCategorias` ("Todos" + categorías con trabajos, por `orden`) y estado vacío con CTA de WhatsApp. Verificar el orden por fecha y la opción activa marcada
- [x] 6.3 Crear `src/pages/trabajos/categoria/[categoria].astro` solo para categorías con trabajos publicados. Verificar que una categoría sin trabajos no genera página ni aparece en el filtro
- [x] 6.4 Crear `src/pages/trabajos/[slug].astro`: título, categoría enlazada, material, descripción, portada `eager` + `fetchpriority="high"`, fotos con texto alternativo de respaldo "<título> — foto N", videos, botón "Quiero algo así", relacionados, enlace a la galería, imagen Open Graph de la portada y mensaje contextual para el botón flotante. Verificar con los trabajos de ejemplo que las secciones vacías no se muestran
- [x] 6.5 Crear `src/pages/aviso-legal.astro` y `src/pages/privacidad.astro` con textos base (LSSI y RGPD; sin cookies ni formularios; contacto por WhatsApp) alimentados por `negocio.legal`. Verificar que muestran los datos configurados y que el build avisa si falta alguno
- [x] 6.6 Crear `src/pages/404.astro` con el layout común y enlaces a inicio y trabajos. Verificar que `npm run preview` la sirve en `/trabajos/no-existe/`
- [x] 6.7 Crear `src/pages/robots.txt.ts` con la URL del sitemap derivada de `site`. Verificar el contenido de `dist/robots.txt`

## 7. Verificación integral

- [x] 7.1 Ejecutar `npm run verify` y comprobar que `astro check`, los tests y el build pasan sin errores
- [x] 7.2 Inspeccionar `dist/`: las páginas sin video no incluyen etiquetas `<script>` ejecutables ni URLs de dominios externos (salvo `wa.me` y las redes en enlaces); las páginas con video solo referencian `i.ytimg.com`; el sitemap contiene las fichas publicadas y no el borrador ni la 404
- [x] 7.3 Revisión manual en el navegador a 320 px, 768 px y 1280 px: sin desplazamiento horizontal, navegación completa por teclado con foco visible y botón flotante sin tapar el pie
- [x] 7.4 Auditar con Lighthouse (móvil) sobre `npm run preview` la página de inicio, la galería y una ficha con video, y anotar las puntuaciones. Verificar que las cuatro categorías son ≥ 90 en las tres páginas
- [x] 7.5 Validar el JSON-LD de la página de inicio generada en validator.schema.org (pegando el HTML). Verificar que detecta `LocalBusiness` sin errores

## 8. Documentación

- [x] 8.1 Escribir `README.md`: requisitos (`nvm use`), comandos, cómo añadir un trabajo, cómo añadir un video (pegar el enlace de YouTube), cómo crear categorías, guía de tamaño de fotos, cómo editar los textos de inicio, los datos del negocio y el logotipo, lista de comprobación previa al lanzamiento (número de WhatsApp, datos legales, URL, revisión de textos legales, borrar ejemplos) y despliegue paso a paso en Cloudflare Pages. Verificar siguiendo la guía para añadir un trabajo nuevo de prueba y eliminarlo después
