# Proposal

## Why

Hoy, para añadir o cambiar un trabajo hay que editar archivos Markdown y subirlos a GitHub. Eso solo lo puede hacer quien programa, y la persona que va a subir las fotos y los enlaces no tiene cuenta de GitHub. Además, el titular quiere mostrar en cada trabajo sus publicaciones de Instagram, y la web todavía no las admite. Ahora que la web está publicada y los ejemplos esperan las fotos reales, es el momento de poder cargar el contenido desde el navegador, también desde el móvil.

## What Changes

- **Panel de edición en `https://cublasercreative.es/admin/`**, protegido con Cloudflare Access. Se entra con un código que llega al correo y solo pueden entrar las direcciones invitadas. No hace falta cuenta de GitHub.
- **Edición completa de los trabajos** desde el panel:
  - Crear, editar y eliminar trabajos.
  - Todos los campos: título, descripción, categoría, fecha, material, texto largo, destacado y borrador.
  - Fotos: portada y fotos adicionales con su texto alternativo. Se suben desde el ordenador o el móvil, y el navegador las reduce y les quita los metadatos (por ejemplo, la ubicación GPS) antes de subirlas.
  - Enlaces de YouTube e Instagram.
  - El panel aplica las mismas reglas que la generación del sitio y avisa de los errores antes de guardar.
- **Guardado como commit en GitHub**: cada guardado crea un único commit en `main` con los cambios del trabajo, y Workers Builds lo publica como cualquier otro cambio. El panel indica cuándo la nueva versión ya está en la web. El contenido sigue siendo Markdown y fotos en el repositorio, sin base de datos.
- **Un Worker propio, solo para la API del panel** (`/admin/api/*`). Guarda en GitHub con un token que solo existe como secreto en Cloudflare y comprueba en cada petición la identidad que certifica Access. El resto del sitio sigue siendo estático y servido sin ejecutar el Worker.
- **Nuevo campo `instagram` en los trabajos**: una lista de enlaces a publicaciones o reels públicos, validados en la generación del sitio igual que los videos.
- **Publicaciones de Instagram con consentimiento** en la ficha del trabajo:
  - Antes de aceptar, no se contacta con Instagram ni se crean cookies. Se muestra un aviso dentro de la sección y un enlace a cada publicación.
  - Si el visitante acepta, las publicaciones se cargan con el código oficial de Instagram y la decisión se recuerda en su navegador, así que en las siguientes fichas se cargan solas.
  - El permiso se puede retirar desde la política de privacidad.
- **Política de privacidad**: deja de decir «sin cookies» sin matices. Explica que Instagram (Meta) solo se carga con el permiso del visitante, qué recibe Meta y cómo retirar el permiso.
- **El panel no aparece en buscadores**: `noindex`, fuera del mapa del sitio y bloqueado en `robots.txt`.

### Fuera de alcance (Non-goals)

- Editar categorías, los textos de la página de inicio o la configuración del negocio desde el panel. Siguen editándose en el código.
- Vista previa de un borrador con el diseño real antes de publicarlo. Un borrador sigue sin verse en la web hasta quitarle la marca.
- Cambiar el identificador (la URL) de un trabajo ya creado.
- Historial o deshacer dentro del panel. El historial ya está en GitHub, y la vuelta atrás se hace desde Cloudflare.
- Detectar desde el panel por qué ha fallado un build. El panel solo avisa de que la web no se ha actualizado.
- Otras redes incrustadas (TikTok, Facebook) e indicador de Instagram en las tarjetas de la galería.

## Capabilities

### New Capabilities
- `panel-trabajos`: panel web para crear, editar y eliminar trabajos sin cuenta de GitHub. Cubre el acceso restringido por correo, el formulario con validación, la subida y reducción de fotos, el guardado como commit, el aviso de publicación, la protección frente a cambios simultáneos y el límite de los archivos que puede tocar.

### Modified Capabilities
- `portafolio-trabajos`:
  - Trabajos definidos como contenido: nuevo campo `instagram`.
  - Validación: un enlace de Instagram no válido hace fallar la generación.
  - Ficha de trabajo: muestra las publicaciones de Instagram.
  - Requisito nuevo: publicaciones de Instagram cargadas solo con consentimiento, recordado y revocable.
- `sitio-base`:
  - Páginas legales: la política de privacidad explica Instagram, el consentimiento y cómo retirarlo. Parte del texto que deja `publicar-web-y-correo`, que debe archivarse antes que este cambio.
  - Rendimiento y privacidad: admite el JavaScript de Instagram y del control de consentimiento, y las peticiones y cookies de Instagram solo después de aceptar.
  - Sitio completamente estático: las páginas públicas siguen siendo estáticas, y el único proceso de servidor es el guardado del panel, del que no depende la web pública.

## Impact

- **Código nuevo**:
  - `worker/` (API del panel).
  - `src/pages/admin/` (interfaz del panel).
  - `src/lib/instagram.ts` y la lógica compartida del panel en `src/lib/` (lectura y escritura del Markdown, validación, nombres de archivo), con sus tests.
  - `src/components/PublicacionesInstagram.astro`.
  - `src/pages/version.json.ts` (commit publicado).
- **Código modificado**:
  - `src/content.config.ts` (campo `instagram`).
  - `src/pages/trabajos/[slug].astro`.
  - `src/pages/privacidad.astro`.
  - `src/pages/robots.txt.ts`.
  - `astro.config.ts` (sitemap sin `/admin/` y proxy de desarrollo).
  - `wrangler.jsonc` (`main`, enlace a los recursos, `run_worker_first`, variables).
  - `public/_headers` y `.gitignore` (`.dev.vars`).
- **Dependencias**: `jose` (verificación del token de Access), `yaml` (Markdown del panel) y los tipos de Workers.
- **Servicios externos (gratuitos)**:
  - Cloudflare Zero Trust, plan Free: Access con código por correo, hasta 50 personas.
  - Workers, plan Free, solo para la API del panel: el contenido estático sigue sin límite.
  - Un token *fine-grained* de GitHub limitado a este repositorio.
  - Instagram (Meta), solo en el navegador de quien acepta.
- **Pasos manuales del titular**:
  - Activar Zero Trust y crear la aplicación de Access con las direcciones invitadas.
  - Crear el token de GitHub y guardarlo como secreto del Worker.
  - Revisar el nuevo texto de privacidad.
- **Documentación**: el README añade una guía de uso del panel y su configuración, y `openspec/config.yaml` deja de decir «sin script propio».
- **Orden de archivado**: `publicar-web-y-correo` tiene que archivarse antes, porque los dos cambios modifican «Páginas legales» de `sitio-base`.
