# Tasks

> Las tareas marcadas con **(titular)** se hacen en paneles a los que solo tiene acceso el titular (Cloudflare, DonDominio, Brevo, Gmail). Claude da las instrucciones paso a paso, espera a que el titular confirme y lo comprueba desde fuera.

## 1. Repositorio

- [x] 1.1 Hacer commit, sin línea de coautoría, de los cambios pendientes (archivado de `crear-web-portafolio`, specs principales y este cambio). Verificar que `git status` queda limpio
- [x] 1.2 Preguntar al titular si los commits deben mostrar su correo personal en el repositorio público o el `noreply` de GitHub. Si elige `noreply`, configurarlo en `git config user.email` del repositorio y reescribir el autor de los commits locales (todavía no subidos). Verificar con `git log --format='%an <%ae>'` _(decisión del titular, 12-10-2026: mantener su correo personal)_
- [x] 1.3 Añadir el remoto `origin` (`https://github.com/eduardoandr3s/cub-laser-creative.git`) y subir `main`. Verificar con `gh repo view eduardoandr3s/cub-laser-creative --json isEmpty,defaultBranchRef` que ya no está vacío y que la rama por defecto es `main`

## 2. Cambios en la web

- [x] 2.1 Poner `legal.email: 'hola@cublasercreative.es'` en `src/config/negocio.ts` y pedir al titular titular, NIF y domicilio. Si los da, añadirlos; si no, seguir y dejarlo anotado como pendiente. Verificar en `dist/aviso-legal/index.html` y `dist/privacidad/index.html` que aparece el correo y que el aviso del build solo nombra los campos que sigan faltando
- [x] 2.2 Actualizar `src/pages/privacidad.astro`: contacto por WhatsApp o por correo, y tratamiento de los mensajes de correo (Cloudflare los reenvía, Google/Gmail los almacena, Brevo envía las respuestas), manteniendo «sin cookies ni formularios». Verificar que la página generada contiene `hola@cublasercreative.es` y nombra los tres proveedores
- [x] 2.3 Poner `borrador: true` en los 5 trabajos de ejemplo. Verificar con `npm run build`:
  - `/trabajos/` muestra el estado vacío con el botón de WhatsApp y no tiene filtro.
  - `/` no contiene «Trabajos destacados» y sí el hero, los diferenciales, los pasos y la llamada final.
  - No hay fichas ni páginas de categoría en `dist/`.
  - El sitemap solo contiene `/`, `/trabajos/`, `/aviso-legal/` y `/privacidad/`.
- [x] 2.4 Instalar `wrangler@^4.149` como dependencia de desarrollo y crear `wrangler.jsonc` según la decisión 1 del diseño. Verificar con `npx wrangler dev` sobre `dist/`:
  - `/trabajos` responde con un 307 a `/trabajos/`.
  - `/trabajos/` responde 200.
  - `/no-existe/` responde 404 con el contenido de la 404 del sitio.
- [x] 2.5 Crear `public/_headers` según la decisión 5 del diseño. Verificar con `npx wrangler dev`:
  - Un archivo de `/_astro/` lleva `Cache-Control: public, max-age=31536000, immutable`.
  - `/` mantiene `max-age=0, must-revalidate`.
  - Todas las respuestas llevan `X-Content-Type-Options: nosniff`.
- [x] 2.6 Reescribir la sección de publicación del README: Workers con Workers Builds, servidores DNS en DonDominio (con el aviso de DNSSEC), dominio, `www` y vuelta atrás. Añadir una sección «Correo hola@» (Email Routing, Brevo, Gmail «Enviar como», DMARC y su endurecimiento posterior a `p=quarantine`) y actualizar la lista previa al lanzamiento. Actualizar en `openspec/config.yaml` el hosting (Workers) y los videos (facade propia sobre `youtube-nocookie.com`). Verificar releyendo que ambos documentos ya no mencionan Pages ni astro-embed como opción vigente
- [ ] 2.7 Ejecutar `npm run verify`, hacer commit (sin coautoría) y push a `main`. Verificar que el build pasa y que el commit aparece en GitHub

## 3. Cloudflare y dominio

- [ ] 3.1 **(titular)** Crear la cuenta de Cloudflare y añadir `cublasercreative.es` en el plan Free. Revisar los registros DNS importados y borrar los de aparcamiento de DonDominio, si los hay. Verificar en el panel que se muestran los dos servidores DNS asignados por Cloudflare
- [ ] 3.2 **(titular)** En DonDominio (Dominios → Gestionar dominio → DNS): comprobar si existe una entrada DNSSEC y eliminarla; después, «Editar servidores DNS» → personalizados, con los dos de Cloudflare. Verificar con `dig NS cublasercreative.es +short` que devuelve los servidores de Cloudflare y en el panel de Cloudflare que la zona está «Activa» (puede tardar de 6 a 12 horas)
- [ ] 3.3 **(titular)** En Workers y Pages → Crear → Importar un repositorio, conectar GitHub y elegir `cub-laser-creative`:
  - Nombre del Worker: `cub-laser-creative`.
  - Comando de build: `npm run build`.
  - Comando de despliegue: `npx wrangler deploy`.
  - Comando para las ramas que no son de producción: `npx wrangler versions upload`.

  Verificar que el primer build termina bien, que su registro usa Node 22 (si no, añadir `NODE_VERSION=22` y repetir) y que la URL `*.workers.dev` sirve la portada
- [ ] 3.4 **(titular)** Añadir `cublasercreative.es` como *Custom Domain* del Worker y activar «Always Use HTTPS». Verificar:
  - `curl -sI https://cublasercreative.es/` devuelve 200 con certificado válido.
  - `curl -sI http://cublasercreative.es/trabajos/` redirige a `https://cublasercreative.es/trabajos/`.
- [ ] 3.5 **(titular)** Crear el registro `www` (`AAAA` → `100::`, con proxy activado) y la *Redirect Rule* «Redirect from WWW to root» (301, conservando ruta y parámetros). Verificar que `curl -sI 'https://www.cublasercreative.es/trabajos/?ref=whatsapp'` devuelve 301 a `https://cublasercreative.es/trabajos/?ref=whatsapp`
- [ ] 3.6 Comprobar los requisitos de `publicacion-sitio` sobre el dominio con `curl`:
  - `/trabajos` → 307 a `/trabajos/`.
  - `/trabajos/no-existe/` → 404 con la página 404.
  - Cabeceras de caché en `/_astro/*` y en `/`.

  Pasar Lighthouse móvil a `https://cublasercreative.es/` y verificar que las cuatro categorías puntúan 90 o más
- [ ] 3.7 Comprobar la publicación automática, las vistas previas y la vuelta atrás:
  1. Subir una rama de prueba con un cambio visible y verificar que genera una URL de vista previa y que el dominio no cambia.
  2. Subir a `main` un cambio de texto y verificar que aparece en el dominio.
  3. Subir a `main` un commit con una categoría inexistente: verificar que el build falla y que el sitio sigue igual; después, revertirlo.
  4. Restaurar un despliegue anterior en el panel, verificar que el dominio lo sirve y volver al último.
  5. Borrar la rama de prueba.
- [ ] 3.8 **(titular)** Intentar desactivar la ruta `*.workers.dev` de producción manteniendo las URLs de vista previa. Verificar que la vista previa de una rama sigue funcionando; si no se puede separar, dejar la ruta activa y anotarlo en el README

## 4. Correo

- [ ] 4.1 **(titular)** Activar Email Routing en la zona, aceptar los registros MX, SPF y DKIM que propone, añadir y verificar como destino el Gmail personal, crear la regla `hola@cublasercreative.es` → Gmail y dejar el catch-all desactivado. Verificar con `dig MX cublasercreative.es +short` que aparecen los tres `route*.mx.cloudflare.net` y con `dig TXT cublasercreative.es +short` que hay un único registro SPF
- [ ] 4.2 **(titular)** Enviar desde una cuenta externa un correo a `hola@cublasercreative.es` y otro a `ventas@cublasercreative.es`. Verificar que el primero llega al Gmail con el remitente original y que el segundo devuelve un aviso de entrega fallida. Crear en Gmail el filtro «Para: hola@cublasercreative.es → No enviar nunca a Spam»
- [ ] 4.3 **(titular)** Crear la cuenta gratuita de Brevo con `hola@cublasercreative.es`, añadir el dominio y autenticarlo con los registros que indique Brevo (automático con Cloudflare si lo ofrece). Si pide un `include` de SPF, fusionarlo en el registro SPF existente. Verificar en Brevo que el dominio aparece autenticado (DKIM en verde) y con `dig TXT cublasercreative.es +short` que sigue habiendo un solo SPF
- [ ] 4.4 **(titular)** Publicar DMARC desde la gestión de DMARC de Cloudflare (`_dmarc`: `v=DMARC1; p=none` con los informes en Cloudflare). Verificar que `dig TXT _dmarc.cublasercreative.es +short` devuelve la política
- [ ] 4.5 **(titular)** Generar una clave SMTP en Brevo y añadir en Gmail «Enviar como» `CUB Laser Creative <hola@cublasercreative.es>` (`smtp-relay.brevo.com`, puerto 587, TLS), confirmarlo con el código recibido y activar «Responder desde la misma dirección a la que se envió el mensaje». Verificar que `hola@cublasercreative.es` aparece como remitente disponible en Gmail
- [ ] 4.6 **(titular)** Responder desde Gmail, como `hola@`, al correo de prueba de la tarea 4.2. Verificar en la cuenta externa:
  - El remitente es `CUB Laser Creative <hola@cublasercreative.es>`, sin rastro del Gmail personal.
  - «Mostrar original» indica `DKIM: PASS` con `cublasercreative.es` y `DMARC: PASS`.
  - El mensaje está en la bandeja de entrada.
  - Al contestar, la respuesta vuelve a `hola@`.

## 5. Cierre

- [ ] 5.1 Repasar los escenarios de las tres specs del cambio con los resultados de las tareas 2.3, 3.4–3.7 y 4.2–4.6. Comprobar que las cuentas de Cloudflare y Brevo están en el plan gratuito y que el README refleja la configuración final. Anotar los pendientes que queden (datos legales, fotos reales, endurecer DMARC a `p=quarantine` en 2–4 semanas)
