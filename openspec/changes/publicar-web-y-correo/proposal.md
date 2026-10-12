# Proposal

## Why

La web de CUB Laser Creative está terminada, pero solo existe en local, y el dominio `cublasercreative.es` (comprado en DonDominio) todavía no apunta a nada. Además, el aviso legal exige un correo electrónico de contacto, y el negocio no tiene ninguno con su dominio. Ahora que hay dominio y repositorio en GitHub, toca publicar la web y crear `hola@cublasercreative.es` sin coste mensual.

## What Changes

- **Publicación en Cloudflare Workers (recursos estáticos)**, gratis y con peticiones ilimitadas. Se elige Workers en vez de Pages, que era lo previsto en el plan original, porque en 2026 Cloudflare dirige ahí los proyectos nuevos y Astro ya no da soporte a Pages con su adaptador. Se añaden un `wrangler.jsonc` y Wrangler como dependencia de desarrollo.
- **Despliegue continuo desde GitHub** (`eduardoandr3s/cub-laser-creative`): cada push a `main` publica la web y cada rama genera una URL de vista previa. Se puede volver a una versión anterior desde el panel.
- **Dominio propio con HTTPS**: los servidores DNS de `cublasercreative.es` pasan de DonDominio a Cloudflare. La web se sirve en `https://cublasercreative.es` y `www` redirige a la versión sin `www`. Las rutas inexistentes devuelven la 404 propia con estado 404.
- **Caché de larga duración** para los recursos con hash (`/_astro/*`) mediante un archivo `_headers`.
- **Correo profesional gratuito**:
  - Recepción: Cloudflare Email Routing reenvía lo que llegue a `hola@cublasercreative.es` al Gmail personal del titular.
  - Envío: Gmail («Enviar como») sale por el SMTP gratuito de Brevo, con el dominio autenticado (SPF, DKIM y DMARC). Así las respuestas llegan como `hola@cublasercreative.es` y no acaban en spam.
- **Datos legales**: `hola@cublasercreative.es` pasa a ser el correo del aviso legal y de la privacidad. Solo se muestra en esas páginas; el contacto visible sigue siendo WhatsApp. La política de privacidad añade el correo como canal de contacto y los proveedores que tratan esos mensajes.
- **Lanzamiento sin trabajos de ejemplo**: los 5 ejemplos pasan a borrador hasta que haya fotos reales. La galería muestra su estado vacío («Muy pronto» con el botón de WhatsApp) y la portada oculta la sección de destacados.
- **Documentación**: el README describe el despliegue en Workers y la configuración del correo, y `openspec/config.yaml` se actualiza (hosting en Workers y facade propia para los videos).

### Fuera de alcance (Non-goals)

- Correo con buzón propio (Google Workspace, Zoho…), formularios de contacto o envío de boletines.
- Analítica web, *Content-Security-Policy* estricta y HSTS con *preload*. Se pueden valorar más adelante.
- Transferir el dominio a otro registrador. El dominio sigue en DonDominio; solo cambian sus servidores DNS.
- Sustituir los ejemplos por trabajos reales: es contenido que irá aportando el titular.

## Capabilities

### New Capabilities
- `publicacion-sitio`: alojamiento y publicación del sitio estático: dominio propio con HTTPS, redirección de `www`, URLs con barra final, respuesta 404 real, despliegue automático desde `main`, vistas previas por rama, vuelta atrás y caché de recursos.
- `correo-profesional`: dirección `hola@` del dominio: recepción en el buzón personal del titular, envío de respuestas con la dirección profesional y autenticación del dominio para la entrega.

### Modified Capabilities
- `sitio-base`:
  - Página de inicio: sin trabajos publicados, la sección de destacados no se muestra.
  - Páginas legales: la política de privacidad añade el correo electrónico como canal de contacto e identifica a los proveedores que tratan los mensajes.

## Impact

- **Código y configuración**:
  - Nuevos: `wrangler.jsonc` y `public/_headers`.
  - Modificados: `package.json` (dependencia `wrangler`), `src/config/negocio.ts` (`legal.email`), `src/pages/privacidad.astro`, el frontmatter de los 5 trabajos de ejemplo (`borrador: true`), `README.md` y `openspec/config.yaml`.
- **Servicios externos (todos gratuitos)**:
  - GitHub (repositorio público ya creado).
  - Cloudflare: DNS, Workers, Workers Builds, Email Routing y reglas de redirección.
  - Brevo (SMTP, 300 correos al día).
  - Gmail del titular.
  - DonDominio (solo para cambiar los servidores DNS).
- **DNS**: la zona pasa a gestionarse en Cloudflare, con registros nuevos para la web, Email Routing (MX y SPF), Brevo (verificación y DKIM) y DMARC.
- **Pasos manuales del titular**: crear las cuentas (Cloudflare, Brevo) y autorizar el acceso a GitHub, cambiar los servidores DNS en DonDominio y configurar Gmail. Las tareas los guían paso a paso.
