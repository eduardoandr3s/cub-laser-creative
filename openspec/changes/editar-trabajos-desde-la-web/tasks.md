# Tasks

> Las tareas marcadas con **(titular)** se hacen en paneles a los que solo tiene acceso el titular (Cloudflare Zero Trust, GitHub) o con su móvil. Claude da las instrucciones paso a paso, espera a que el titular confirme y lo comprueba desde fuera. Los secretos (el token de GitHub) se pegan en la terminal con `!`, nunca en el chat.

## 1. Instagram en los trabajos

- [x] 1.1 Crear `src/lib/instagram.ts` con `parseInstagram` (decisión 10 del diseño) y `src/lib/instagram.test.ts`:
  - Se aceptan `/p/`, `/reel/`, `/reels/` y `/tv/`, con `www.`, `m.` o sin subdominio, con el nombre de la cuenta delante y con `?igsh=`.
  - Se rechazan perfiles, historias, enlaces de otros dominios y códigos demasiado cortos.

  Verificar con `npm run test`
- [x] 1.2 Añadir el campo `instagram` al schema de `src/content.config.ts`, con un mensaje de error con ejemplos, y sacar `MAX_DESCRIPCION = 160` a una constante compartida. Verificar con `npm run build`:
  - Pasa sin cambios en los trabajos.
  - Con `instagram: [https://www.instagram.com/cublasercreative/]` en un ejemplo, falla nombrando el trabajo y el campo `instagram`. Deshacer después la prueba.
- [x] 1.3 Crear `src/lib/permiso-instagram.ts` (leer, conceder y retirar en `localStorage`, tolerando que no esté disponible) con sus tests sobre un almacenamiento simulado. Verificar con `npm run test`
- [x] 1.4 Crear `src/components/PublicacionesInstagram.astro` (tarjetas-enlace, aviso con botón de contorno, carga de `embed.js` tras el permiso) e incluirlo en `src/pages/trabajos/[slug].astro` debajo de los videos, solo si hay publicaciones. Pedir al titular 1 o 2 enlaces de publicaciones suyas y añadirlos a un trabajo de ejemplo en borrador. Verificar en `astro dev`:
  - Sin permiso, el HTML y la pestaña Red no tienen ninguna petición a `instagram.com`, `cdninstagram.com` ni `facebook`.
  - Con JavaScript desactivado, solo se ven los enlaces.
  - Al aceptar, se cargan las publicaciones.
  - Otra ficha con Instagram las carga sola.
  - Una ficha sin Instagram no incluye el script.
- [x] 1.5 Comprobar con el lector de pantalla del navegador (o el árbol de accesibilidad de las herramientas) y a 320 px que el aviso y el botón tienen nombre accesible, foco visible y no tapan el WhatsApp flotante. Verificar con una captura a 320 px

## 2. Privacidad

- [x] 2.1 Actualizar `src/pages/privacidad.astro` según la decisión 11:
  - Sección `#instagram`.
  - «Sin cookies propias ni formularios».
  - Meta descripción.
  - Control `<permiso-instagram>` que muestra el estado y retira el permiso.

  Verificar en `astro dev`: tras aceptar en una ficha, la privacidad muestra «permitido»; al retirarlo muestra «no permitido», y la ficha vuelve a mostrar el aviso sin contactar con Instagram
- [x] 2.2 Con el permiso concedido, anotar desde las herramientas del navegador (Aplicación → Cookies) las cookies que crea Instagram y nombrarlas en la política (pregunta abierta del diseño). Pedir al titular que revise el texto. Verificar que el titular da el visto bueno
- [x] 2.3 Ejecutar `npm run verify`, hacer commit (sin coautoría) y push a `main`. Verificar:
  - El commit aparece en GitHub y la web se actualiza (`curl` con `?v=$RANDOM`).
  - `/privacidad/` muestra la sección de Instagram.
  - Lighthouse móvil de una ficha publicada da ≥ 90 en las cuatro categorías. Si no hay fichas publicadas, se mide en `wrangler dev` con un borrador desmarcado en local.

## 3. Acceso y credenciales (titular)

- [x] 3.1 **(titular)** En el panel de Cloudflare → Zero Trust: elegir el nombre del equipo y el plan Free. Si pide una tarjeta y el titular no quiere ponerla, parar y replantear el acceso con él antes de seguir (riesgos del diseño). Verificar que `https://<equipo>.cloudflareaccess.com/cdn-cgi/access/certs` devuelve claves públicas
- [x] 3.2 **(titular)** Crear la aplicación *self-hosted* «Panel CUB» para `cublasercreative.es/admin` con *One-time PIN*, sesión de 1 mes y política *Allow* con el correo del titular. Copiar el *Application Audience (AUD) Tag*. Verificar con `curl -sI https://cublasercreative.es/admin/` y `curl -sI https://cublasercreative.es/admin/api/sesion` que ambos redirigen a `<equipo>.cloudflareaccess.com`
- [x] 3.3 **(titular)** Crear en GitHub un token *fine-grained* solo para `cub-laser-creative`, con *Contents: Read and write* y la caducidad máxima, y crear la rama `prueba-panel` desde `main`. Guardarlo:
  - Como secreto, con `! npx wrangler secret put GITHUB_TOKEN`.
  - En `.dev.vars` (escrito por el titular).

  Verificar:
  - `npx wrangler secret list` muestra `GITHUB_TOKEN`.
  - `git check-ignore .dev.vars` confirma que no se sube.

## 4. Worker y API del panel

- [x] 4.1 Añadir las dependencias `jose` y `yaml` y generar los tipos con `npx wrangler types`. Crear:
  - `worker/tsconfig.json`.
  - La exclusión de `worker` en el `tsconfig.json` raíz.
  - La comprobación de ambos en `npm run check`.
  - `.dev.vars*` en `.gitignore`.
  - `worker/**/*.test.ts` en `vitest.config.ts`.

  Verificar con `npm run check` y `npm run test`
- [x] 4.2 Configurar `wrangler.jsonc` (`main`, `assets.binding`, `run_worker_first: ["/admin/api/*"]` y `vars`: `ACCESS_EQUIPO`, `ACCESS_AUD`, `GITHUB_REPO` y `GITHUB_RAMA`) y crear `worker/index.ts` con el enrutado y `GET /admin/api/sesion`. Verificar con `npm run build && npx wrangler dev`:
  - `/` y `/trabajos/` se sirven igual que antes.
  - `/no-existe/` sigue dando 404.
  - `/admin/api/sesion` da 403 sin `ACCESO_LOCAL`, y 200 con el correo ficticio cuando está activado.
- [x] 4.3 Crear `src/lib/panel/rutas.ts` (slug, nombres de archivo, ruta de la carpeta) con sus tests. Deben rechazarse `../`, `/`, mayúsculas, espacios, `.md` distintos de `index.md` y extensiones no permitidas. Verificar con `npm run test`
- [x] 4.4 Implementar la verificación del JWT de Access (decisión 3) y las comprobaciones de `Origin` y `X-Panel`. Probar con una clave RSA generada en el test y un JWKS simulado: token válido, `aud` incorrecto, `iss` incorrecto, caducado y ausente, y `ACCESO_LOCAL` con un host que no es `localhost`. Verificar con `npm run test`
- [x] 4.5 Implementar `GET /contenido`, `GET /blob/<sha>` y `POST /fotos` (límite de 8 MB, alfabeto base64) con `fetch` simulado en los tests. Verificar:
  - Con `npm run test`.
  - Con `wrangler dev` contra `prueba-panel`: `/admin/api/contenido` lista los 5 trabajos y las 5 categorías, y `/blob/<sha>` devuelve un `index.md` y una foto con su `Content-Type`.
- [x] 4.6 Implementar `POST /guardar` y `POST /eliminar` (decisión 4). En los tests:
  - Un guardado hace un único commit.
  - Ruta no permitida → 400 sin subpeticiones.
  - `indexSha` distinto → 409.
  - Si `main` avanza durante el guardado, se reintenta una vez.
  - Un 401 de GitHub → mensaje de credencial caducada.
  - El token no aparece en ninguna respuesta.

  Verificar con `npm run test` y con `wrangler dev` contra `prueba-panel`: guardar un cambio con una foto nueva crea un solo commit con los dos archivos
- [x] 4.7 Crear `src/pages/version.json.ts` y la regla `Cache-Control: no-store` de `/version.json` en `public/_headers`, e implementar `GET /incluye`. Verificar:
  - `WORKERS_CI_COMMIT_SHA=abc123 npm run build` deja `dist/version.json` con `{"commit":"abc123"}`.
  - `wrangler dev` sirve la cabecera.
  - `/incluye` responde bien para un commit anterior y otro posterior en `prueba-panel`.

## 5. Lógica compartida del panel

- [x] 5.1 Crear `src/lib/panel/markdown.ts` (`leerTrabajo` y `escribirTrabajo`, decisión 7) con tests. Leer y volver a escribir los 5 trabajos actuales da el mismo frontmatter, salvo comentarios. Los opcionales vacíos y los booleanos por defecto se omiten. Las fotos se escriben con `./`. Verificar con `npm run test` y con `npm run build` sobre una copia de los ejemplos reescrita por `escribirTrabajo` (en una rama local desechable)
- [x] 5.2 Crear `src/lib/panel/validacion.ts` y `slugificar` con tests de los escenarios de la spec:
  - Vimeo da error con ejemplos.
  - 161 caracteres → «sobra 1 carácter».
  - Portada sin texto alternativo.
  - Categoría inexistente.
  - «Caja grabada para Lucía» → `caja-grabada-para-lucia`.
  - Slug repetido.

  Verificar con `npm run test`

## 6. Interfaz del panel

- [x] 6.1 Crear `src/layouts/PanelLayout.astro` y `src/pages/admin/index.astro` (`noindex, nofollow`), excluir `/admin/` del sitemap y añadir `Disallow: /admin/` a `robots.txt`. Añadir el proxy de desarrollo de `/admin/api` en `astro.config.ts`. Verificar tras `npm run build`:
  - Ninguna URL `/admin/` en `dist/sitemap-0.xml`.
  - `dist/robots.txt` contiene el `Disallow`.
  - `dist/admin/index.html` tiene la meta `robots`.
- [x] 6.2 Lista de trabajos (`src/panel/`): miniatura, título, fecha, «Borrador»/«Publicado», enlace a la web solo para los publicados, y botón «Nuevo trabajo». Verificar con `wrangler dev` contra `prueba-panel` que aparecen los 5 ejemplos marcados como borrador y en orden de fecha
- [x] 6.3 Formulario con todos los campos, contador de la descripción, listas de videos e Instagram (añadir, quitar, subir y bajar), y errores junto a cada campo con `aria-describedby`. Verificar en el navegador los escenarios de validación de la spec y que no se puede guardar con errores
- [x] 6.4 Fotos: elegir varias o hacerlas con la cámara, reducir (decisión 8), subir con progreso, poner texto alternativo, reordenar, quitar y «Usar como portada». Verificar con una foto vertical de 4032×3024 con GPS que la guardada en `prueba-panel` mide 1800×2400, se ve derecha y no tiene EXIF (`python3 -I -c` con PIL o `exiftool`)
- [x] 6.5 Crear un trabajo (slug propuesto y editable hasta el primer guardado, aviso de slug repetido, borrador marcado por defecto) y eliminarlo (confirmación que nombra el trabajo y recordatorio de usar «borrador»). Verificar en `prueba-panel` que crear y eliminar generan un commit cada uno y que cancelar no cambia nada
- [x] 6.6 Guardado y estado: «Publicando…», «Publicado», «Guardado como borrador: no se verá en la web» y el aviso a los 5 minutos. El 409 se muestra con «Volver a cargar» sin borrar lo escrito. Verificar:
  - Con dos pestañas sobre el mismo trabajo en `prueba-panel`, el segundo guardado no se aplica.
  - Con `/version.json` simulado en local, se pasa a «Publicado».
- [x] 6.7 Repasar el panel a 320 px y solo con teclado: controles de al menos 44×44 px, foco visible y etiquetas asociadas. Verificar con capturas a 320 px de la lista y del formulario

## 7. Publicación y prueba real

- [x] 7.1 Actualizar el README y `openspec/config.yaml`:
  - README: guía para quien edita (entrar, crear, fotos, borrador, qué hacer si no se publica), configuración (Access, invitar a alguien, token y su renovación) y desarrollo local (`.dev.vars`, `prueba-panel`).
  - `openspec/config.yaml`: Worker solo para `/admin/api`, panel, e Instagram con permiso.

  Verificar releyendo que ya no dicen «sin script propio» ni «sin cookies» sin matices
- [x] 7.2 **Antes de nada, el titular regenera el token de GitHub** (el 12-11 salió por error en la conversación): «Regenerate token» en GitHub y actualizarlo en el secreto (`npx wrangler secret put GITHUB_TOKEN`) y en `.dev.vars`. Comprobar que las tareas 3.2 y 3.3 están hechas. Ejecutar `npm run verify`, hacer commit (sin coautoría) y push a `main`. Verificar:
  - El build de Workers Builds pasa.
  - `/` responde 200 sin pasar por el Worker.
  - `/admin/` redirige a Access.
  - En una vista previa de rama (`*.workers.dev`), `/admin/api/sesion` responde 403.
- [x] 7.3 **(titular)** Prueba de principio a fin desde el móvil:
  1. Entrar con el código.
  2. Crear un trabajo en borrador con una foto de la cámara, un video de YouTube y una publicación de Instagram, y guardar. El aviso debe ser el de borrador.
  3. Desmarcar «borrador» y guardar: pasa a «Publicado» y la ficha se ve en la web con Instagram tras aceptar.
  4. Eliminarlo: la ficha da 404 tras publicarse.

  Verificar en GitHub que cada guardado es un solo commit y que no aparece el correo de quien edita. Medir con `npx wrangler tail` que ninguna petición supera los 10 ms de CPU
- [ ] 7.4 **(titular)** Añadir a la política de Access el correo de la persona que va a editar y probar que entra. Verificar que un correo no invitado no recibe un código válido
- [ ] 7.5 Revisar en el panel de Cloudflare que Workers, Workers Builds y Zero Trust siguen en el plan gratuito y que el consumo de builds del mes está lejos del límite. Verificar con una captura o con el texto del panel que pegue el titular

## 8. Cierre

- [ ] 8.1 Repasar los escenarios de las tres specs del cambio con los resultados de las partes 1 a 7 y anotar los pendientes (por ejemplo, la mejora de los *check runs* y una eliminación que gastó 14 ms de CPU en la prueba de la 7.3, la única de más de 60 por encima de 10 ms). Archivar antes `publicar-web-y-correo` (cuando estén hechas su 4.6 y su 5.1) y después este cambio. Verificar con `openspec validate --strict` y `openspec list` que solo queda archivado
