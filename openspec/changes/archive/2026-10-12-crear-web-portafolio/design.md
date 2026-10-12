# Design

## Context

Proyecto nuevo: el repositorio solo contiene la configuración de OpenSpec. La motivación y el alcance están en `proposal.md`; los requisitos, en `specs/`. Restricciones que condicionan el diseño:

- Coste de infraestructura cero (salvo dominio) → sitio 100 % estático.
- Quien publica trabajos no tiene por qué saber programar → el contenido debe vivir en archivos simples con validación clara.
- Hay una referencia de marca (paleta del logotipo, tipografía, secciones de inicio, SEO local en Valencia) que sirve de guía, no de plantilla cerrada.
- Versiones vigentes comprobadas en npm (octubre de 2026): Astro 7.3 (requiere Node ≥ 22.12), Tailwind CSS 4.3, `@astrojs/sitemap` 3.7, `@lucide/astro` 1.55 (compatible con Astro 7), Vitest 5. `@astrojs/check` 0.9 solo admite TypeScript 5 o 6.

## Goals / Non-Goals

**Goals:**
- Una única fuente de verdad para cada dato: negocio en `src/config/negocio.ts`, textos de inicio en `src/config/inicio.ts`, trabajos y categorías en `src/content/`, tokens visuales en `src/styles/global.css`.
- Toda la lógica no visual (enlaces de WhatsApp, interpretación de URLs de YouTube, selección de destacados y relacionados, JSON-LD) en funciones puras con tests unitarios.
- Errores de contenido detectados en `npm run build`, con mensajes que digan qué archivo y qué campo corregir.

**Non-Goals:**
- Tests end-to-end en navegador ni Lighthouse automatizado en CI (la auditoría será manual en esta fase).
- Reproducir literalmente la referencia de marca: se adapta donde choca con accesibilidad o con el stack (por ejemplo, Tailwind 4 ya no usa `tailwind.config.mjs`).

## Decisions

### 1. Astro 7 en modo estático
Salida estática por defecto (`output: 'static'`), `build.format: 'directory'` y `trailingSlash: 'always'`, para que las URLs canónicas sean siempre `/ruta/`.
- *Alternativas*: HTML puro (repetición manual de layout y tarjetas); Next.js (más complejo y orientado a Vercel); WordPress (hosting de pago y mantenimiento).

### 2. Estructura del contenido
```
src/content/
  categorias/
    llaveros.yml         # nombre, orden, descripcion?
    placas.yml
  trabajos/
    llavero-boda-ana-luis/
      index.md           # frontmatter + descripción larga
      portada.jpg
      detalle-1.jpg
```
- `src/content.config.ts` define dos colecciones con el loader `glob` de `astro/loaders`:
  - `categorias`: patrón `*.yml`, id = nombre del archivo.
  - `trabajos`: patrón `*/index.md`, con `generateId` que devuelve el nombre de la carpeta (evita ids como `x/index`).
- Schema con Zod 4 (`astro/zod`): `categoria: reference('categorias')`, fotos con el helper `image()` (rutas relativas al `index.md`), `descripcion: z.string().max(160)`, `fecha: z.coerce.date()`, `videos: z.array(...).default([])`.
- Categorías iniciales según la referencia de marca: Llaveros, Placas conmemorativas, Marcos, Eventos (bodas, comuniones…) y Empresas.
- *Alternativas descartadas*: fotos en `src/assets/` separadas del texto (más fácil equivocarse de ruta); categorías como `enum` en código.

### 3. Capa de acceso a datos en `src/lib/trabajos.ts`
Todas las páginas obtienen los trabajos mediante `getTrabajosPublicados()`, que filtra los borradores cuando `import.meta.env.PROD` es verdadero y ordena por fecha descendente (el orden de `getCollection()` no está garantizado). Sobre esa lista trabajan dos funciones puras, `seleccionarDestacados(trabajos, max = 6)` y `seleccionarRelacionados(trabajos, actual, max = 3)`. Como ninguna página genera rutas para los borradores, estos quedan fuera del mapa del sitio sin lógica adicional.

### 4. Rutas
| Ruta | Archivo | Notas |
|---|---|---|
| `/` | `src/pages/index.astro` | Secciones de inicio + JSON-LD |
| `/trabajos/` | `src/pages/trabajos/index.astro` | Galería + filtro |
| `/trabajos/<slug>/` | `src/pages/trabajos/[slug].astro` | `getStaticPaths` sobre los publicados |
| `/trabajos/categoria/<slug>/` | `src/pages/trabajos/categoria/[categoria].astro` | Solo categorías con trabajos |
| `/aviso-legal/`, `/privacidad/` | `src/pages/aviso-legal.astro`, `src/pages/privacidad.astro` | Datos de `negocio.legal` |
| 404 | `src/pages/404.astro` | Cloudflare Pages sirve `404.html` automáticamente |
| `/robots.txt` | `src/pages/robots.txt.ts` | Endpoint estático; la URL del sitemap sale de `site` |

El filtro por categoría son enlaces a páginas pregeneradas: cero JavaScript, URLs compartibles e indexables.

### 5. Configuración del negocio validada
`src/config/negocio.ts` exporta un objeto validado con Zod al importarse:
- `nombre`, `eslogan`, `descripcion`, `url`
- `ubicacion { localidad: 'Valencia', provincia: 'Valencia', pais: 'ES', zonaServicio }`
- `whatsapp { numero, mensajeGenerico }`
- `redes` (URLs opcionales; la referencia indica el usuario `@cublasercreative`)
- `legal { titular, nif, domicilio, email }`

Reglas:
- `whatsapp.numero`: regex `^[1-9]\d{7,14}$`. En producción, un número inválido lanza un error que detiene el build; en desarrollo se emite `console.warn` y los botones de WhatsApp se renderizan deshabilitados.
- `legal.*`: opcionales en el schema; si falta alguno, se emite un `console.warn` con los campos ausentes (sin bloquear el build).
- `astro.config.ts` importa `negocio.url` para el campo `site`, de modo que la URL no se duplica.

### 6. Textos de inicio editables
`src/config/inicio.ts` exporta `hero { titular, subtitulo }`, `diferenciales[] { icono, titulo, texto }` y `pasos[] { titulo, texto }`. `icono` es el nombre de un icono Lucide validado contra un mapa cerrado de iconos permitidos, para que un nombre erróneo falle en el build y no en producción. Los componentes `Hero`, `Diferenciales`, `Destacados`, `ComoEncargar` y `CtaWhatsApp` solo leen datos.
- *Alternativa*: una colección de contenido para la home. Se descarta porque son unos pocos textos con estructura fija; un objeto tipado basta y da autocompletado.

### 7. WhatsApp
`src/lib/whatsapp.ts` expone `enlaceWhatsApp(numero, mensaje)`, que devuelve `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, y `mensajeTrabajo(titulo, url)`. Componentes:
- `BotonWhatsApp.astro`: reutilizable en el hero, en la CTA final y en "Quiero algo así".
- `WhatsAppFlotante.astro`: incluido en el layout; recibe el mensaje desde las props del layout (contextual en la ficha, genérico en el resto).

El botón flotante usa el verde de WhatsApp (`#25D366`) con el icono en neutro oscuro, porque el blanco sobre ese verde da 1,98:1 y no cumple el contraste de iconos. El pie reserva `padding-bottom` para que el botón no tape sus enlaces.

### 8. Videos: facade propia
`src/lib/youtube.ts` → `parseYouTube(entrada)`, que devuelve `{ id, vertical }`. Acepta `watch?v=`, `youtu.be/`, `shorts/`, `embed/` y un id de 11 caracteres; `shorts/` implica `vertical: true`. Se aplica como `transform` en el schema, así que una URL inválida falla en el build con la ruta del campo.

Render con una facade propia en `src/components/VideoYouTube.astro` (elemento personalizado `<video-youtube>`): muestra la miniatura de `i.ytimg.com` y un botón, y solo al pulsar crea el **iframe** de `youtube-nocookie.com` con `autoplay=1`. Sin JavaScript, el botón es un enlace al video en YouTube. Su script (unas pocas líneas, sin dependencias) se agrupa por componente y solo se incluye en páginas con videos. Para los Shorts, un contenedor con `aspect-ratio: 9/16` y ancho máximo limitado.

> **Cambio durante la implementación (12-10-2026):** se descartó `<YouTube>` de `@astro-community/astro-embed-youtube`. Su base, `lite-youtube-embed` 0.3, en Safari y en navegadores móviles carga la API de `www.youtube.com` y crea el reproductor en ese dominio (con cookies), lo que incumple el requisito de usar el dominio de privacidad mejorada. Contrapartida aceptada: en móviles el navegador suele exigir un segundo toque para que el video empiece a reproducirse.
- *Alternativas*: iframe directo con `loading="lazy"` (sigue cargando unos 600 KB del reproductor en cuanto entra en pantalla y crea cookies de YouTube); `astro-embed` / `lite-youtube-embed` (descartado, ver la nota anterior).

### 9. Identidad visual con Tailwind 4
Tailwind 4 vía `@tailwindcss/vite`; sin `tailwind.config.mjs`. Los tokens se definen una vez en `src/styles/global.css` con `@theme`:

| Token | Valor | Uso permitido |
|---|---|---|
| `--color-cian` | `#00A3FF` | Fondos con texto `tinta` (6,5:1), degradados, detalles decorativos |
| `--color-cian-texto` | `#006AAD` | Enlaces y texto en cian sobre `papel`, blanco o `madera` (≥ 5:1) |
| `--color-magenta` | `#E6007A` | Botón principal con texto blanco (4,52:1), titulares grandes y acentos; nunca texto normal sobre fondo claro |
| `--color-ambar` | `#FFB800` | Fondos con texto `tinta` (10,3:1), degradados, insignias |
| `--color-tinta` | `#0F172A` | Texto y estructura |
| `--color-papel` | `#F8FAFC` | Fondo base |
| `--color-madera` | `#F5EFE6` (aprox.) | Fondos de sección alternos, con un tono cálido de contrachapado claro |

- **Logotipo textual**: componente `Logo.astro` con "C" en `tinta` y "UB" con `bg-clip-text` y degradado cian → magenta → ámbar, más el subtítulo en versalitas. Cuando haya un SVG oficial, `Logo.astro` lo usará en su lugar sin afectar a nada más.
- **Tipografía**: Plus Jakarta Sans variable, autoalojada con `@fontsource-variable/plus-jakarta-sans` (geométrica y con más carácter que Inter).
- **Iconos**: `@lucide/astro` (SVG en línea, cero JS), con `aria-hidden` cuando son decorativos. Lucide no incluye logotipos de marcas, así que los de WhatsApp, Instagram, TikTok y Facebook serán SVG locales en `src/components/iconos/`.
- **Recurso visual**: una franja fina con el degradado CMYK como separador o subrayado de títulos, que evoca la impresión a todo color sin saturar la interfaz.

### 10. Imágenes
`<Picture>` de `astro:assets` con `formats={['avif','webp']}`, `widths` y `sizes` según el contexto. La portada de la ficha y las 3 primeras tarjetas usan `loading="eager"` (la portada, además, `fetchpriority="high"`, porque es el LCP); el resto, `lazy`. La imagen Open Graph de la ficha se obtiene con `getImage()` a 1200 px de ancho y URL absoluta.

### 11. SEO técnico y local
- `src/components/SEO.astro` en el `<head>` del layout: título, descripción, canónica (`Astro.url` + `Astro.site`) y Open Graph/Twitter. La imagen por defecto es `public/og-default.png` (1200×630, con la marca).
- `src/lib/jsonld.ts` → `localBusiness(negocio)` genera el JSON-LD `LocalBusiness` (tiene test unitario); se inserta en la página de inicio con `<script type="application/ld+json">`, que no se ejecuta como JavaScript. Se usa `LocalBusiness` porque Schema.org no tiene un tipo "Craftsman"; `areaServed` cubre Valencia y alrededores.
- `@astrojs/sitemap` genera `sitemap-index.xml`, filtrando la 404.

### 12. Calidad
- `vitest` para `whatsapp.ts`, `youtube.ts`, `jsonld.ts` y las funciones de selección de `trabajos.ts`.
- `astro check` con TypeScript 6 (TypeScript 7 todavía no es compatible con `@astrojs/check`).
- El script `npm run verify` encadena `astro check`, `vitest run` y `astro build`.

### 13. Despliegue
Cloudflare Pages conectado al repositorio Git: comando de build `npm run build`, salida `dist` y Node desde `.nvmrc` (`22`). Cada push a `main` despliega; cada rama genera una URL de vista previa.
- *Alternativas*: la referencia proponía Vercel o Netlify. El plan gratuito de Vercel (Hobby) es solo para uso no comercial, y esta web es de un negocio. Netlify es válido, pero su plan gratuito limita el ancho de banda; Cloudflare Pages no lo limita. El sitio es estático y portable, así que cambiar de proveedor no requiere tocar código.

## Risks / Trade-offs

- [En móviles, el iframe creado tras el toque no siempre arranca solo (las políticas de reproducción automática no heredan el gesto)] → Se acepta un segundo toque; a cambio, el video siempre se sirve desde `youtube-nocookie.com`. Si se quisiera un solo toque, habría que cargar la API de YouTube, que se sirve desde `www.youtube.com`.
- [Los colores de la marca usados sin criterio rompen el contraste] → Tokens con uso documentado (tabla de la decisión 9) y revisión de contraste en la tarea de verificación.
- [Las fotos sin comprimir hinchan el repositorio y alargan el build] → Guía en el README (máx. ~2500 px de lado y < 1,5 MB por foto); Astro cachea las imágenes optimizadas. Si el volumen crece, migrar a un CDN de imágenes en un cambio posterior.
- [Desplegar con el número de WhatsApp sin rellenar] → El build de producción falla (decisión 5).
- [Publicar sin datos legales completos] → Aviso en consola en cada build; queda en la lista de comprobación previa al lanzamiento del README.
- [Textos legales genéricos] → Son una base estándar; el titular debe revisarlos antes de publicar.
- [Miniatura de YouTube desde `i.ytimg.com`] → Aceptado en la spec de privacidad; solo ocurre en páginas con videos y no crea cookies.

## Migration Plan

No hay versión previa que migrar. Primer despliegue:
1. Crear el repositorio remoto (por ejemplo, en GitHub) y hacer push de `main`.
2. Conectar Cloudflare Pages con los parámetros de la decisión 13.
3. Actualizar `negocio.url` con la URL `*.pages.dev` asignada (o el dominio propio cuando exista) y volver a desplegar.

**Rollback**: desde el panel de Cloudflare Pages se puede promover cualquier despliegue anterior con un clic.

## Open Questions

- Número de WhatsApp real: imprescindible antes del primer build de producción.
- Archivo del logotipo oficial (SVG preferiblemente) para sustituir el logotipo textual.
- Datos legales del titular: nombre o razón social, NIF, domicilio y correo.
- Redes en las que existe `@cublasercreative` (Instagram, TikTok, Facebook…).
- Confirmar las categorías iniciales y los textos de "¿Por qué CUB?" y de los pasos de pedido.
- Fotos reales, videos de YouTube y dominio propio (por ejemplo, `cublasercreative.com` o `.es`).
