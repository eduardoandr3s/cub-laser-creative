# Design

## Context

El motivo está en `proposal.md`; los requisitos, en `specs/`. Situación de partida:

- **Contenido**: cada trabajo es `src/content/trabajos/<slug>/index.md` más sus fotos en la misma carpeta, validado por el schema de `src/content.config.ts`. `comprobarFotos` nombra el trabajo y el campo si falta una foto. Los videos se validan con `parseYouTube` (`src/lib/youtube.ts`). Las categorías son `src/content/categorias/<slug>.yml`.
- **Publicación**:
  - Cloudflare Workers con recursos estáticos y sin script (`wrangler.jsonc`: `workers_dev: false`, `preview_urls: true`, `previews: {}`, `not_found_handling: "404-page"`).
  - Workers Builds publica cada push a `main` en unos 45 s. Si el build falla, sigue la versión anterior (comprobado en la tarea 3.7 de `publicar-web-y-correo`).
- **Repositorio**: público, `eduardoandr3s/cub-laser-creative`. Los commits los firma el autor con su correo personal, por decisión suya.
- **Quién edita**: el titular y, al menos, una persona sin cuenta de GitHub. Seguramente subirán fotos desde el móvil.
- **Límites del plan Free de Workers** que condicionan la API:
  - 100 000 peticiones al día.
  - 10 ms de CPU por petición (la espera de red no cuenta).
  - 50 subpeticiones por invocación.
  - 100 MB por cuerpo de petición.
- **Workers Builds** expone `WORKERS_CI_COMMIT_SHA` durante el build.
- **Cloudflare Access**:
  - Envía al origen el JWT de la sesión en la cabecera `Cf-Access-Jwt-Assertion`.
  - Las claves públicas están en `https://<equipo>.cloudflareaccess.com/cdn-cgi/access/certs`.
  - Hay que comprobar los campos `aud` e `iss`.
- **Instagram**:
  - Con `curl` (11-11-2026), Instagram devuelve una página genérica que crea la cookie `csrftoken` (`domain=.instagram.com`, 400 días, `SameSite=None`), no la inserción.
  - En un navegador real (Firefox con todas las cookies permitidas, como Chrome por defecto, 12-11-2026), la inserción no crea cookies ni usa `localStorage`. Solo recibe las cookies de `instagram.com` que el navegador ya tuviera, como `csrftoken`, que se crea al abrir `instagram.com` directamente.
- **Cambio abierto**: `publicar-web-y-correo` sigue abierto (faltan las tareas 4.6 y 5.1) y también modifica «Páginas legales» de `sitio-base`.

## Goals / Non-Goals

**Goals:**
- Que la web pública siga siendo estática y no dependa del panel: si el Worker falla, solo deja de funcionar el guardado.
- Que el repositorio siga siendo la única fuente del contenido. Lo que guarda el panel tiene el mismo formato que un trabajo escrito a mano, y el build lo valida igual.
- Que ninguna credencial de escritura llegue al navegador ni al repositorio.
- No añadir servicios de pago ni bases de datos.

**Non-Goals:**
- Un CMS genérico. El panel solo conoce los trabajos y lee las categorías.
- Usar el adaptador `@astrojs/cloudflare` o convertir páginas públicas en páginas renderizadas en el servidor.
- Gestionar desde el panel las personas invitadas. Se hace en Cloudflare Zero Trust.

## Decisions

### 1. Acceso con Cloudflare Access y código por correo
- Cloudflare Zero Trust, plan Free (hasta 50 personas).
- Aplicación *self-hosted* «Panel CUB» sobre `cublasercreative.es/admin`, que cubre `/admin/` y todo lo que hay debajo, incluida la API.
- Identificación con *One-time PIN*: Cloudflare manda un código al correo.
- Política *Allow* con la lista de correos invitados.
- Duración de la sesión: 1 mes. Así quien edita desde el móvil no tiene que pedir un código cada vez. El daño posible está acotado por la decisión 4.
- El `aud` de la aplicación y el dominio del equipo van como `vars` en `wrangler.jsonc`. No son secretos.
- *Alternativas*:
  - Iniciar sesión con GitHub (Sveltia CMS): descartado, porque exige cuenta de GitHub a cada persona.
  - Usuarios y contraseñas propios (D1 o KV con enlaces mágicos enviados por Brevo): habría que guardar contraseñas, recuperar accesos y evitar ataques por fuerza bruta, y Access ya lo hace gratis.
  - DecapBridge o Pages CMS: un tercero guarda un token con escritura en el repositorio, y el panel no estaría en el dominio o dependería de su plan gratuito.

### 2. Un Worker propio solo para `/admin/api/*`
`wrangler.jsonc` añade:
- `main: "worker/index.ts"`.
- `assets.binding: "ASSETS"`.
- `assets.run_worker_first: ["/admin/api/*"]`.

Las demás peticiones las siguen sirviendo los recursos estáticos sin ejecutar el Worker, así que siguen siendo gratis e ilimitadas y no cuentan para el límite diario. Se mantienen `not_found_handling`, `html_handling`, `workers_dev: false`, `preview_urls: true` y `previews: {}`.

Organización del código:
- **`worker/`**: tiene su propio `tsconfig.json` con los tipos de Workers, generados con `wrangler types`, y se excluye del `tsconfig` de Astro. `npm run check` comprueba ambos.
- **`src/lib/panel/`**: la lógica que comparten el Worker y la interfaz (formato del Markdown, reglas de nombres, validación). Es TypeScript puro, sin APIs del navegador ni de Node, y se prueba con vitest.

*Alternativas*:
- Adaptador `@astrojs/cloudflare` con rutas en el servidor: cambia la salida de todo el build por cuatro rutas de API.
- Un Worker aparte en otro subdominio: duplica la configuración de Access y obliga a gestionar CORS y cookies entre dominios.

### 3. Comprobación de identidad en cada petición
Se comprueba aunque Access ya proteja la ruta, porque las vistas previas (`*.workers.dev`) no pasan por Access y el Worker sí se ejecuta allí:
- **JWT de Access**: se verifica `Cf-Access-Jwt-Assertion` con `jose` (`createRemoteJWKSet` y `jwtVerify`, con `issuer` y `audience`). Es el ejemplo oficial de Cloudflare, y las claves quedan en caché en el ámbito del módulo. Sin token válido, la respuesta es 403 y no hay ninguna subpetición a GitHub.
- **Contra CSRF**:
  - Las peticiones que escriben exigen la cabecera `X-Panel: 1` y un `Origin` igual al del propio sitio.
  - El Worker no responde a CORS, así que otra web no puede enviar esa cabecera.
- **Desarrollo local**:
  - Si `ACCESO_LOCAL=1` (solo en `.dev.vars`, ignorado por git) y el host es `localhost` o `127.0.0.1`, se omite la verificación y se usa un correo ficticio.
  - En producción el host nunca es `localhost`, así que la variable no tiene efecto aunque se configure por error.

### 4. GitHub como almacén, con un token *fine-grained* guardado como secreto
- **Token**:
  - Token *fine-grained* del titular, limitado al repositorio `cub-laser-creative`, con el permiso *Contents: Read and write* (*Metadata: Read* se añade solo).
  - Se guarda con `npx wrangler secret put GITHUB_TOKEN`.
  - Nunca se escribe en archivos del repositorio ni se devuelve al navegador.
  - Caducidad: la máxima que permita GitHub, con un recordatorio en el README para renovarlo.
- **Repositorio y rama**: `GITHUB_REPO` y `GITHUB_RAMA` van en `vars`. En local, `.dev.vars` apunta a una rama de pruebas (`prueba-panel`) para no tocar `main`.
- **Un commit por guardado con la API Git Data** (pasos 1 a 6). En el peor caso, con un reintento, son 12 subpeticiones:
  1. `GET git/ref/heads/<rama>`: commit C.
  2. `GET git/commits/C`: árbol T.
  3. `GET contents/src/content/trabajos/<slug>?ref=C`: archivos actuales y `sha` de `index.md`.
  4. `POST git/trees` con `base_tree: T`. El `index.md` va en línea (`content`). Las fotos nuevas, por el `sha` de su blob. Las eliminadas, con `sha: null`.
  5. `POST git/commits` con padre C.
  6. `PATCH git/refs/heads/<rama>` sin `force`. Si falla porque `main` ha avanzado (otro commit en medio), se repite una vez desde el paso 1.

  La API *Contents* se descarta porque crea un commit por archivo, y cada commit lanzaría un build.
- **Commit**:
  - Mensaje `Panel: crear «<título>»`, `Panel: guardar «<título>»` o `Panel: eliminar «<título>»`.
  - Sin autor explícito: figura el dueño del token. El correo de quien edita no se escribe, porque el repositorio es público.
- **Cambios simultáneos**:
  - El cliente envía el `sha` del `index.md` que cargó. Si en el paso 3 no coincide, se responde 409 sin escribir nada.
  - Para un trabajo nuevo, el 409 salta si la carpeta ya existe.
- **Alcance**:
  - El Worker solo construye rutas `src/content/trabajos/<slug>/<archivo>`.
  - `slug` debe cumplir `^[a-z0-9]+(-[a-z0-9]+)*$`.
  - `archivo` debe ser `index.md` o cumplir `^[a-z0-9]+(-[a-z0-9]+)*\.(jpg|png|webp)$`.
  - Cualquier otra cosa da 400. Las reglas están en `src/lib/panel/rutas.ts` y las usan la interfaz y el Worker.
- *Alternativas*:
  - R2 o D1 como almacén: el contenido saldría del repositorio, Astro ya no optimizaría las fotos en el build y se perdería el historial.
  - GitHub App en vez de token: no caduca, pero hay que registrar la app, guardar una clave privada y firmar JWT. Se puede migrar más adelante sin cambiar la API.

### 5. API del panel, diseñada para los 10 ms de CPU
| Ruta | Qué hace |
| --- | --- |
| `GET /admin/api/sesion` | Devuelve el correo de la sesión. |
| `GET /admin/api/contenido` | Lee `git/trees/<rama>?recursive=1`, filtra `src/content/trabajos/` y `src/content/categorias/` y devuelve rutas y `sha`. |
| `GET /admin/api/blob/<sha>?nombre=<archivo>` | Devuelve el contenido de un blob tal cual (Markdown, YAML o foto), con `Content-Type` según la extensión y `Cache-Control: private, max-age=31536000, immutable`, porque el `sha` identifica el contenido. |
| `POST /admin/api/fotos` | Recibe la foto ya reducida y en base64 (máximo 8 MB), comprueba el alfabeto base64 y crea el blob en GitHub. Devuelve su `sha`. |
| `POST /admin/api/guardar` | JSON con `slug`, `nuevo`, `indexSha`, `markdown`, `fotos` (nombre → `sha`) y `borrar` (nombres). Hace el commit de la decisión 4. |
| `POST /admin/api/eliminar` | `slug` e `indexSha`. Un commit que borra todos los archivos de la carpeta. |
| `GET /admin/api/incluye?commit=<a>&publicado=<b>` | Usa `compare/a...b` para saber si la versión publicada ya contiene un commit (decisión 9). |

El Worker no interpreta Markdown ni imágenes: solo valida rutas y tamaños y reenvía datos. El cliente lee el Markdown, y los `index.md` se descargan uno a uno por `/blob/`. Cada descarga es una invocación aparte, así que no se llega al límite de subpeticiones, y la caché del navegador la sirve las siguientes veces. Se descarta GraphQL porque el soporte de los tokens *fine-grained* no está garantizado, y porque la respuesta llega toda de una vez y no se cachea por archivo.

### 6. Interfaz del panel: una página estática de Astro con TypeScript sin framework
- `src/pages/admin/index.astro`:
  - Usa un layout propio y ligero (`PanelLayout.astro`), sin el WhatsApp flotante ni la navegación pública.
  - Lleva `noindex, nofollow`.
  - Usa los mismos estilos de Tailwind y la misma tipografía.
- El código del cliente está en `src/panel/` (llamadas a la API, fotos, formulario, lista, estado de publicación) y usa `yaml` para leer y escribir el contenido.
- Pantallas, con navegación por hash: `#/` (lista), `#/nuevo` y `#/trabajo/<slug>`.
- Formulario pensado primero para el móvil:
  - Reordenar con botones «Subir» y «Bajar», sin arrastrar, para que sea accesible.
  - Contador de caracteres en la descripción.
  - Los errores se asocian a su campo con `aria-describedby`.
- El sitemap excluye `/admin/` (filtro de `@astrojs/sitemap`), y `robots.txt` añade `Disallow: /admin/`.
- *Alternativas*:
  - Preact o Svelte con su integración de Astro: simplifica el estado del formulario, pero añade dependencias y configuración solo para una página interna.
  - Sveltia CMS servido desde `/admin/` con un *proxy* de la API de GitHub detrás de Access: daría una interfaz completa, pero depende de detalles internos (token de relleno, `api_root`) que pueden cambiar entre versiones, y no reduce las fotos con las mismas garantías.

### 7. Formato del Markdown que escribe el panel
En `src/lib/panel/markdown.ts`:
- `leerTrabajo(texto)` separa el frontmatter (YAML) del cuerpo.
- `escribirTrabajo(datos, cuerpo)` genera el archivo:
  - Orden fijo: `titulo`, `descripcion`, `categoria`, `fecha`, `borrador`, `material`, `destacado`, `portada`, `imagenes`, `videos`, `instagram`.
  - Fechas como `AAAA-MM-DD`.
  - Las rutas de las fotos con `./`, como en los trabajos actuales.
  - Omite los opcionales vacíos y los booleanos en su valor por defecto: `borrador` y `destacado` solo aparecen si valen `true`.
- Al guardar desde el panel se pierden los comentarios YAML (`# Video de ejemplo…`). Se acepta porque solo existen en los ejemplos.
- Los tests comprueban que leer y volver a escribir los 5 trabajos actuales da el mismo resultado, salvo los comentarios, y que el build acepta lo que genera.
- **Validación** (`src/lib/panel/validacion.ts`):
  - Los mismos límites que el schema, sacados de constantes compartidas: `MAX_DESCRIPCION = 160`, que también usa `content.config.ts`.
  - Los mismos analizadores: `parseYouTube` y `parseInstagram`.
  - Comprueba que la categoría está en la lista leída del repositorio.
- **Identificador**: `slugificar(titulo)` pasa a minúsculas, quita tildes (NFD) y cambia lo que no sea `a-z0-9` por guiones. Se puede editar hasta el primer guardado y luego queda fijo.

### 8. Fotos: reducción en el navegador
- `<input type="file" accept="image/jpeg,image/png,image/webp" multiple>`. En iOS, ese `accept` hace que las fotos HEIC se conviertan a JPEG al elegirlas. En Android, ofrece la cámara y la galería.
- `createImageBitmap(archivo, { imageOrientation: 'from-image' })`, después un `canvas` de 2400 px como máximo en el lado mayor y por último `toBlob('image/jpeg', 0.82)`.
  - Al volver a codificar se pierden todos los metadatos EXIF, también el GPS.
  - Si el navegador no puede decodificar la foto (por ejemplo, HEIC en Chrome de escritorio), se muestra «Este formato no se puede leer; guarda la foto como JPG y vuelve a subirla».
- **Nombres**: cada foto nueva se llama `foto-<n>.jpg`, con `n` el primer número libre en la carpeta. La portada no tiene un nombre especial: es la foto a la que apunta `portada.src`, así que «Usar como portada» solo intercambia referencias.
- **Subida y borrado**:
  - Cada foto se sube al elegirla (`POST /fotos`), con su progreso.
  - Al guardar, el commit referencia los blobs subidos. Si no se llega a guardar, los blobs quedan sueltos y GitHub los elimina solo.
  - Se borran del repositorio las fotos que el trabajo referenciaba al abrirlo y ya no referencia. Otros archivos de la carpeta no se tocan.
- *Alternativas*:
  - Subir el original y reducirlo en el build: el repositorio crecería de 3 a 8 MB por foto y la ubicación GPS quedaría publicada en el historial.
  - Cloudflare Images: tiene coste y sobra, porque Astro ya genera los tamaños.

### 9. Aviso de publicación con `/version.json`
- **`/version.json`**: `src/pages/version.json.ts` (prerenderizado) escribe `{ "commit": "<WORKERS_CI_COMMIT_SHA>" }`, o `null` si el build es local. `public/_headers` le pone `Cache-Control: no-store`.
- **Comprobación tras guardar**: el panel consulta `/version.json` cada 10 s.
  - Si `commit` es el suyo, muestra «Publicado».
  - Si es otro, pregunta a `/admin/api/incluye`, por si otro commit posterior ya lo contiene.
  - A los 5 minutos sin éxito, muestra el aviso de posible fallo.
  - Si el trabajo es borrador, avisa de que no se verá en la web.
- *Alternativas*:
  - API de Cloudflare para leer el estado del build: hace falta otro token con permisos sobre la cuenta.
  - *Check runs* de GitHub: no está comprobado que Workers Builds los publique. Se puede mejorar más adelante si se confirma.

### 10. Instagram: campo, código oficial de inserción y permiso en el navegador
- **`src/lib/instagram.ts`**: `parseInstagram(enlace)` acepta:
  - `instagram.com/{p|reel|reels|tv}/<código>`.
  - Con `www.`, `m.` o sin subdominio.
  - Con el nombre de la cuenta delante (`/<cuenta>/p/<código>`).
  - Con parámetros (`?igsh=…`).

  Devuelve `{ codigo, tipo: 'p' | 'reel', url }`, con `url` canónica `https://www.instagram.com/<tipo>/<codigo>/`, o `null`. El código cumple `[A-Za-z0-9_-]{5,64}`. Tests al estilo de `youtube.test.ts`.
- **Schema**: `instagram: z.array(publicacionInstagram).default([])`. El mensaje de error incluye ejemplos válidos, igual que el de `videoYouTube`.
- **`PublicacionesInstagram.astro`**, sección «En Instagram» de la ficha, debajo de los videos:
  - **Sin JavaScript** o **sin permiso**:
    - Una lista de tarjetas-enlace («Ver publicación en Instagram», con el icono local `iconos/Instagram.astro`), en una pestaña nueva.
    - Con JavaScript, además, un aviso dentro de la sección con el texto del permiso, un botón con contorno (no relleno, para no competir con «Quiero algo así») «Mostrar publicaciones de Instagram» y un enlace a `/privacidad/#instagram`.
  - **Con permiso**: cada tarjeta se sustituye por `<blockquote class="instagram-media" data-instgrm-permalink="<url>" data-instgrm-version="14">` y se carga una vez `https://www.instagram.com/embed.js`, o se llama a `window.instgrm.Embeds.process()` si ya está cargado.
  - El permiso se guarda en `localStorage` (`cub:permiso-instagram` = `concedido`). Guardar la decisión del visitante es un uso exento de consentimiento. Si `localStorage` no está disponible (modo privado estricto), el permiso dura solo esa página.
- **Aviso dentro de la sección, no barra flotante**: el titular eligió «aviso y, si acepta, se carga sola». Se coloca dentro de la sección para que no tape el WhatsApp flotante ni compita con el botón principal (ver la regla de jerarquía de WhatsApp). No lleva botón «No, gracias»: no aceptar equivale a rechazar.
- **Retirar el permiso**: un elemento `<permiso-instagram>` en `/privacidad/` muestra el estado y un botón para retirarlo (borra la clave). Las cookies que Instagram ya creó son de su dominio y el sitio no puede borrarlas, así que la política explica cómo hacerlo desde el navegador.
- La lógica del permiso (leer, conceder, retirar) está en `src/lib/permiso-instagram.ts` y la comparten los dos scripts.
- *Alternativas*:
  - `iframe` propio a `/p/<código>/embed/` con ajuste de altura por `postMessage`: no se pudo verificar (ver Context) y depende de mensajes internos sin documentar.
  - API oEmbed de Meta para sacar una miniatura y hacer una *facade* con imagen: exige una app de Meta con revisión y un token.
  - Plataforma de consentimiento (CMP) externa: añade un script de terceros a todas las páginas y suele ser de pago.

### 11. Política de privacidad
Cambios en `src/pages/privacidad.astro`:
- «Sin cookies ni formularios» pasa a «Sin cookies propias ni formularios».
- Nueva sección `#instagram`:
  - Qué se carga y cuándo.
  - Meta Platforms Ireland como responsable de lo que recoge.
  - Datos que recibe: IP, navegador y página visitada.
  - Cookies de Meta: las que el navegador ya tenga de Instagram (como `csrftoken` o la sesión) y las que Meta pueda crear. Transferencia a EE. UU. bajo el Marco de Privacidad de Datos.
  - Que el permiso se guarda en el navegador sin cookie.
  - El control para retirarlo.
- La meta descripción deja de decir «sin cookies».

El texto lo revisa el titular antes de publicar, como el resto de las páginas legales.

### 12. Desarrollo local y pruebas
- `npm run build && npx wrangler dev`: el sitio y el Worker en `localhost:8787`, con `.dev.vars` (`GITHUB_TOKEN` de pruebas, `GITHUB_RAMA=prueba-panel`, `ACCESO_LOCAL=1`).
- Para trabajar en la interfaz con recarga en caliente, `astro.config.ts` añade `vite.server.proxy` de `/admin/api` a `localhost:8787`.
- **Tests (vitest)**:
  - `parseInstagram`, `slugificar`, reglas de rutas, lectura y escritura del Markdown, y validación.
  - El Worker, con `fetch` simulado: rechazo sin JWT, rutas no permitidas, conflicto 409, reintento ante un avance de `main`, y que el token no aparece en ninguna respuesta.
  - `vitest.config.ts` incluye `worker/**/*.test.ts`.

## Risks / Trade-offs

- [El token de GitHub caduca] → El panel deja de guardar, pero la web no se ve afectada. El Worker traduce el 401 de GitHub a «El acceso a GitHub ha caducado: avisa a quien mantiene la web». El README explica cómo renovarlo (`wrangler secret put`).
- [Zero Trust pide una tarjeta al activar el plan Free] → No hay cargos en el plan Free hasta 50 personas. Si el titular no quiere poner tarjeta, hay que replantear el acceso antes de la parte 3 de las tareas (alternativa: enlaces mágicos propios por Brevo).
- [Un guardado deja contenido que el build rechaza] → El panel valida con las mismas reglas, y si aun así falla, la web sigue con la versión anterior y el panel avisa a los 5 minutos. Se arregla editando el trabajo o con `git revert`.
- [Se supera el límite de 10 ms de CPU] → El Worker no interpreta Markdown ni imágenes, y la comprobación del base64 es una expresión regular sobre unos 700 KB. Se mide con `wrangler tail` en la verificación. Si hiciera falta, la foto se enviaría en trozos.
- [`embed.js` de Instagram se ejecuta en la página] → Solo después del permiso y solo en fichas con publicaciones. Si Instagram lo cambia o lo retira, siguen funcionando los enlaces.
- [El repositorio crece con las fotos] → Unos 400–700 KB por foto reducida. Con 50 trabajos al año y 4 fotos por trabajo, unos 100 MB al año, muy por debajo del límite recomendado por GitHub (1 GB). Se revisará si el ritmo crece.
- [Cada guardado lanza un build] → Pocos guardados al día: el cupo gratuito de Workers Builds sobra. Se comprueba en el panel durante la verificación.
- [Las vistas previas ejecutan el Worker sin Access] → Las peticiones a la API devuelven 403 por falta de JWT, así que el panel solo funciona en producción y en local.
- [Quien tenga sesión puede leer cualquier blob del repositorio por su `sha`] → El repositorio ya es público. Si dejara de serlo, `/blob/` limitaría los `sha` a los del árbol de `src/content/`.
- [Doble edición del mismo trabajo] → 409 y aviso (decisión 4). Lo escrito sigue en el formulario para poder copiarlo.
- [Texto legal] → Es una base razonable, no asesoramiento jurídico. El titular la revisa.

## Migration Plan

1. Implementar y publicar el campo `instagram`, el componente y la privacidad (partes 1 y 2 de las tareas). No cambia nada visible mientras ningún trabajo tenga publicaciones de Instagram.
2. El titular crea la aplicación de Access **antes** del primer despliegue del panel, para que `/admin/` nunca esté expuesta sin protección.
3. El titular crea el token y lo guarda como secreto (`! npx wrangler secret put GITHUB_TOKEN`, pegándolo en la terminal, nunca en el chat).
4. Desplegar el Worker y el panel. Probar de principio a fin con un trabajo en borrador y después eliminarlo.
5. **Vuelta atrás**:
   - Quitar `main`, `run_worker_first` y `assets.binding` de `wrangler.jsonc`: el sitio vuelve a ser solo estático.
   - Revocar el token en GitHub y borrar la aplicación de Access.
   - Lo que se guardó desde el panel sigue siendo contenido válido en el repositorio.
6. **Archivado**: primero `publicar-web-y-correo` y después este cambio. La delta de «Páginas legales» de aquí parte del texto de aquel.

## Open Questions

- ~~Lista exacta de cookies que crea la inserción de Instagram en un navegador real.~~ Resuelta el 12-11-2026: no crea ninguna y solo recibe las que ya hubiera (ver Context). La política lo dice así, nombrando `csrftoken` y la sesión como ejemplos.
- Si Workers Builds publica *check runs* en GitHub. Si es así, el aviso de fallo podría ser inmediato en lugar de esperar 5 minutos. Mejora posterior, sin cambiar la spec.
