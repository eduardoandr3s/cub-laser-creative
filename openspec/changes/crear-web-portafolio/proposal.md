# Proposal

## Why

CUB Laser Creative (Valencia, España) hace corte láser e impresión a todo color sobre madera: llaveros, placas conmemorativas, marcos y detalles para eventos y empresas. Hoy no tiene presencia web propia y solo puede enseñar sus trabajos por redes o en persona. Una web portafolio sencilla permite mostrar los trabajos (fotos y, más adelante, videos) en un único sitio enlazable, posicionarse en búsquedas locales y convertir las visitas en conversaciones por WhatsApp, con coste de infraestructura prácticamente nulo.

## What Changes

- Nuevo proyecto Astro estático con Tailwind CSS, Node 22 fijado en `.nvmrc` y npm.
- **Identidad visual de marca**: logotipo "CUB" con degradado cian → magenta → ámbar y subtítulo "LÁSER CREATIVE — Corte y Grabado a Todo Color", paleta de la marca aplicada respetando el contraste accesible, fondos claros con toques cálidos de madera, tipografía sans geométrica autoalojada e iconos Lucide.
- Modelo de contenido para **trabajos** y **categorías** basado en Content Collections: añadir un trabajo consiste en crear una carpeta con un `index.md` y sus fotos, sin tocar código.
- **Videos de YouTube preparados desde el inicio**: cada trabajo admite una lista de enlaces de YouTube (videos normales o Shorts). Mientras no haya videos, no se muestra nada; al pegar un enlace, el video aparece en la ficha. El iframe de YouTube solo se carga cuando el visitante pulsa reproducir.
- **Página de inicio** con: hero con llamadas a WhatsApp y a los trabajos, sección "¿Por qué CUB Laser Creative?", trabajos destacados, pasos para encargar un diseño a medida y llamada final a WhatsApp. Sus textos se editan en un único archivo.
- **Galería de trabajos** (`/trabajos/`) con filtro por categoría mediante páginas estáticas (sin JavaScript).
- **Ficha de cada trabajo** (`/trabajos/<slug>/`) con fotos optimizadas, videos y botón "Quiero algo así" que abre WhatsApp con un mensaje que menciona el trabajo.
- **Botón flotante de WhatsApp** en todas las páginas.
- **Páginas legales** (aviso legal y privacidad) generadas a partir de los datos del titular, exigidas en España para webs con actividad comercial.
- Datos del negocio (nombre, eslogan, ubicación, WhatsApp, redes, datos legales) centralizados en un único archivo de configuración validado.
- **SEO técnico y local**: títulos y descripciones por página, Open Graph para compartir por WhatsApp y redes, datos estructurados `LocalBusiness` orientados a Valencia, `sitemap.xml`, `robots.txt`, favicon y página 404.
- Sin cookies, por lo que no hace falta banner de consentimiento.
- Trabajos de ejemplo con imágenes provisionales hasta tener las fotos reales.
- `README.md` con instrucciones para añadir trabajos, añadir videos y desplegar en Cloudflare Pages.

### Fuera de alcance (Non-goals)

- CMS o panel de administración (se valorará en un cambio posterior).
- Formulario de contacto, tienda online, blog, multi-idioma y analítica.
- Visor de imágenes tipo *lightbox* (requiere JavaScript; se pospone).
- Redacción jurídica revisada por profesional: los textos legales serán una base estándar que el titular debe revisar.
- Compra de dominio y conexión de la cuenta de Cloudflare (pasos manuales del propietario).

## Capabilities

### New Capabilities
- `portafolio-trabajos`: modelo de contenido de trabajos y categorías, galería con filtro por categoría, ficha de trabajo con fotos y videos de YouTube.
- `contacto-whatsapp`: generación de enlaces de WhatsApp desde la configuración del negocio, botón flotante global y llamadas a la acción contextuales con mensaje prellenado.
- `sitio-base`: estructura común del sitio (layout, identidad visual, inicio, páginas legales, 404), configuración centralizada del negocio, SEO técnico y local, accesibilidad, rendimiento y privacidad.

### Modified Capabilities
<!-- Ninguna: es el primer cambio del proyecto. -->

## Impact

- **Código**: proyecto nuevo con `astro.config.ts`, `src/content.config.ts`, `src/config/`, `src/layouts/`, `src/components/`, `src/pages/`, `src/lib/`, `src/styles/` y `src/content/`.
- **Dependencias**: `astro`, `tailwindcss` + `@tailwindcss/vite`, `@astrojs/sitemap`, `@lucide/astro`, `@fontsource-variable/plus-jakarta-sans`. En desarrollo: `vitest`, `@astrojs/check` y `typescript@6`.
- **Sistemas externos**: YouTube (videos vía `youtube-nocookie.com`), WhatsApp (`wa.me`) y Cloudflare Pages (hosting gratuito con uso comercial permitido). Sin backend ni base de datos.
