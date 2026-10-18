# Design

## Context

El motivo está en `proposal.md`; los requisitos, en `specs/`. Situación de partida:

- **Sitio**: Astro 7 estático. `npm run build` genera `dist/`, con URLs con barra final (`trailingSlash: 'always'`, `build.format: 'directory'`), `404.html`, `sitemap-index.xml` y `robots.txt`. El build falla a propósito si el número de WhatsApp no es válido; si faltan datos legales, solo avisa.
- **Repositorio**: hay un commit local (`2e8d447`) y cambios sin commitear del archivado anterior. El remoto `https://github.com/eduardoandr3s/cub-laser-creative` existe, es **público** y está vacío. `gh` tiene la sesión iniciada como `eduardoandr3s`.
- **Dominio**: `cublasercreative.es`, registrado en DonDominio y todavía sin web ni correo. Los servidores DNS se cambian en el panel de DonDominio (Dominios → Gestionar dominio → DNS → «Editar servidores DNS» → servidores personalizados). Según DonDominio, la propagación tarda de 6 a 12 horas.
- **Cloudflare (octubre de 2026)**: Pages sigue funcionando, pero las novedades llegan a Workers. Los recursos estáticos de Workers son gratis e ilimitados y admiten los archivos `_headers` y `_redirects`. Por defecto usan `html_handling: "auto-trailing-slash"`: `/carpeta/` sirve `carpeta/index.html` y `/carpeta` redirige con un 307 a `/carpeta/`.
- **Quién hace qué**: Claude no puede entrar en las cuentas del titular (Cloudflare, DonDominio, Brevo, Gmail). Esos pasos los hace el titular siguiendo instrucciones; Claude prepara el repositorio y comprueba el resultado desde fuera (`dig`, `curl`, build).

## Goals / Non-Goals

**Goals:**
- Que todo lo que pueda vivir en el repositorio viva ahí (`wrangler.jsonc`, `public/_headers`, documentación). Si un día hay que rehacer la cuenta de Cloudflare, basta con volver a conectar el repositorio.
- Comprobar cada requisito de las specs desde fuera, con comandos reproducibles.
- Que en el repositorio público no haya ningún secreto: la clave SMTP de Brevo solo se guarda en Gmail.

**Non-Goals:**
- Automatizar la configuración de Cloudflare con Terraform o con la API. Son unos pocos pasos que se hacen una sola vez en el panel.
- Usar el adaptador `@astrojs/cloudflare`: el sitio sigue siendo 100 % estático, sin Worker propio.

## Decisions

### 1. Cloudflare Workers con recursos estáticos, sin script
`wrangler.jsonc` en la raíz:
- `name`: `cub-laser-creative`. Debe coincidir con el nombre del Worker en el panel, o Workers Builds falla.
- `compatibility_date`: la fecha de la implementación.
- `assets.directory`: `./dist`.
- `assets.not_found_handling`: `"404-page"`, para responder con estado 404 y el `404.html`.
- `assets.html_handling`: `"auto-trailing-slash"`, escrito de forma explícita aunque sea el valor por defecto, porque el requisito de barra final depende de él.

No hay `main`: sin script, todas las peticiones las sirven los recursos estáticos, que son gratis e ilimitados.
- *Alternativas*:
  - Cloudflare Pages: era el plan anterior. Es más sencillo en el panel, pero ya no recibe novedades.
  - Netlify: su plan gratuito limita el ancho de banda.
  - Vercel Hobby: no permite uso comercial.
  - GitHub Pages: sus condiciones excluyen las webs principalmente comerciales.

### 2. Despliegue con Workers Builds conectado a GitHub
- Producción: rama `main`, con el comando de build `npm run build` y el de despliegue `npx wrangler deploy`.
- Otras ramas: `npx wrangler preview` (Worker Previews, en beta abierta), que publica cada rama en `<rama>-cub-laser-creative.<subdominio>.workers.dev` sin tocar producción. Exige un bloque `previews` en `wrangler.jsonc`, que puede ir vacío. _(Corregido el 18-10: el plan decía `npx wrangler versions upload`, pero el panel ya no lo ofrece a los Workers nuevos.)_
- Si el build falla (contenido inválido, número de WhatsApp incorrecto…), no se despliega nada y sigue la versión anterior. Así se cumple el requisito sin lógica adicional.
- `wrangler` se añade como dependencia de desarrollo (`^4.149`), para que el build en la nube y el titular en local usen la misma versión. Además permite `npx wrangler dev` (probar en local con el mismo enrutado que en producción) y `npx wrangler deploy` (desplegar a mano si Workers Builds fallara).
- Node: se espera que el build lea `.nvmrc` (22); se comprobará en el primer registro de build. Si no lo hace, se define la variable `NODE_VERSION=22` en el panel.
- *Alternativa*: GitHub Actions con `wrangler deploy`. Se descarta porque necesita un token de Cloudflare guardado como secreto y no aporta nada a un sitio de este tamaño.

### 3. DNS en Cloudflare con el dominio en DonDominio
Se añade la zona `cublasercreative.es` al plan Free de Cloudflare y se cambian los servidores DNS en DonDominio por los dos que asigne Cloudflare.
- Antes de cambiarlos, se comprueba en DonDominio si hay una entrada DNSSEC y, si la hay, se elimina. Con un registro DS antiguo, los resolutores que validan DNSSEC dejarían de resolver el dominio.
- Cuando la zona esté «Activa», DNSSEC se puede reactivar desde Cloudflare copiando su registro DS en DonDominio («Crear entrada DNSSEC»). Es opcional.
- *Alternativa*: dejar el DNS en DonDominio y apuntar solo un CNAME. Se descarta porque Email Routing y los dominios personalizados de Workers en el dominio raíz exigen que el DNS lo gestione Cloudflare.

### 4. Dominio, www y HTTPS
- **Dominio raíz**: se añade `cublasercreative.es` como *Custom Domain* del Worker. Cloudflare crea el registro DNS y el certificado.
- **www**: se crea un registro `www` con proxy activado, del tipo `AAAA` a `100::` (el registro de relleno habitual para que una regla de Cloudflare tenga algo que interceptar), y una *Redirect Rule* con la plantilla «Redirect from WWW to root»: 301 que conserva la ruta y los parámetros. No se añade `www` como dominio del Worker, para no servir contenido duplicado.
- **HTTPS**: se activa «Always Use HTTPS». HSTS queda fuera de alcance.
- **workers.dev**: se desactiva la ruta `*.workers.dev` de producción y se mantienen las URLs de vista previa, con `"workers_dev": false` y `"preview_urls": true` en `wrangler.jsonc`. _(Corregido el 18-10: el plan era hacerlo en el panel, pero `wrangler deploy` vuelve a aplicar lo que diga la configuración, y `workers_dev` vale `true` por defecto.)_

### 5. Caché con `public/_headers`
```
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Content-Type-Options: nosniff
```
Astro pone una huella del contenido en el nombre de todo lo que genera en `/_astro/`, así que se puede cachear para siempre. El HTML conserva la cabecera por defecto de Workers (`public, max-age=0, must-revalidate`), y una nueva publicación se ve al recargar. `_headers` va en `public/` porque Astro lo copia tal cual a `dist/`.

### 6. Correo entrante: Cloudflare Email Routing
- **Destino**: el Gmail personal del titular. Se verifica desde el correo que manda Cloudflare. La dirección personal no se escribe en el repositorio.
- **Regla**: `hola@cublasercreative.es` → destino.
- **Catch-all**: desactivado. Así las direcciones no configuradas se rechazan en la conexión SMTP y el remitente recibe un aviso. La acción «Drop» del catch-all, en cambio, las descartaría en silencio.
- **DNS**: al activarlo, Cloudflare añade sus registros MX (`route1/2/3.mx.cloudflare.net`), un SPF `v=spf1 include:_spf.mx.cloudflare.net ~all` y su DKIM de reenvío.
- **Spam**: el reenvío reescribe el remitente del sobre (SRS) y añade ARC, pero Gmail puede tardar en fiarse. Se crea en Gmail un filtro «Para: hola@cublasercreative.es → No enviar nunca a Spam».
- *Alternativas*:
  - ImprovMX: su plan gratuito no permite enviar.
  - Correo de DonDominio: requiere contratar alojamiento.
  - Zoho Mail gratis: es otro buzón aparte (el titular quiere centralizar todo en Gmail) y no incluye IMAP.

### 7. Correo saliente: Gmail «Enviar como» por el SMTP de Brevo
- **Brevo**:
  - Cuenta gratuita (300 correos al día), registrada con `hola@cublasercreative.es`; los correos de alta llegan por Email Routing.
  - Se autentica el dominio con los registros que indique Brevo (verificación `brevo-code` y DKIM). Si Brevo ofrece la configuración automática con Cloudflare, se usa.
  - Se genera una clave SMTP en «SMTP y API».
- **Gmail** (Configuración → Cuentas e importación → «Enviar como»):
  - Nombre: «CUB Laser Creative»; dirección: `hola@cublasercreative.es`.
  - Servidor `smtp-relay.brevo.com`, puerto 587, con TLS; el usuario es el login SMTP de Brevo y la contraseña, la clave SMTP.
  - Se confirma con el código que llega por Email Routing.
  - Se activa «Responder desde la misma dirección a la que se envió el mensaje».
- **DMARC**: Brevo firma con DKIM `d=cublasercreative.es`, así que DMARC se cumple por alineación DKIM, aunque el *Return-Path* sea de Brevo.
- *Alternativas*:
  - SMTP de Gmail con contraseña de aplicación: firma como `gmail.com`, falla DMARC y deja ver el Gmail personal («en nombre de»). Incumple el requisito de correo profesional.
  - Cloudflare Email Service: el envío está pensado para Workers por API, no como SMTP para Gmail.

### 8. SPF único y DMARC progresivo
- **SPF**: solo puede haber un registro por nombre. Si Brevo pide su `include`, se fusiona con el de Cloudflare en uno solo (`v=spf1 include:_spf.mx.cloudflare.net include:spf.brevo.com ~all`), sin crear un segundo registro.
- **DMARC**: se publica `_dmarc` con `v=DMARC1; p=none` y los informes (`rua`) dirigidos a la gestión de DMARC de Cloudflare (gratuita). Así los informes no llenan el Gmail.
- **Endurecimiento**: tras 2–4 semanas de informes limpios se pasa a `p=quarantine`. Queda anotado en el README como paso posterior; no bloquea este cambio.

### 9. Cambios en la web
- `src/config/negocio.ts`: `legal.email = 'hola@cublasercreative.es'`. El aviso legal ya lo muestra mediante `DatoLegal`. No se añade al pie.
- `src/pages/privacidad.astro`: la sección de contacto pasa a «WhatsApp o correo». Se describe el tratamiento por correo: Cloudflare reenvía los mensajes, Google (Gmail) los almacena y Brevo envía las respuestas. Se mantiene «sin cookies ni formularios».
- **Ejemplos**: `borrador: true` en los 5 trabajos de ejemplo. La galería ya tiene un estado vacío, y `Destacados.astro` ya se oculta si no hay trabajos: se verifica, no se reprograma.
- **Datos legales**: se piden al titular titular, NIF y domicilio. Si todavía no los tiene, se publica igualmente (el build solo avisa) y se deja anotado como pendiente.

### 10. Repositorio público
Todo lo que hay en el repositorio ya es público en la web (WhatsApp, y los datos legales cuando estén), así que puede seguir siendo público. Lo único sensible es el correo personal del autor en los metadatos de los commits (`git log`). Antes del primer push se pregunta al titular si prefiere usar el correo `noreply` de GitHub. Si es así, se reescribe el autor de los commits locales: es seguro porque todavía no se han subido.

## Risks / Trade-offs

- [DNSSEC activo en DonDominio al cambiar los servidores DNS] → El dominio deja de resolver para los resolutores que validan. Mitigación: comprobar y eliminar la entrada antes del cambio (decisión 3).
- [Propagación lenta del cambio de servidores en `.es`] → No hay web ni correo previos, así que no hay corte. Se espera a que Cloudflare marque la zona como «Activa» antes de configurar el dominio y el correo.
- [Los primeros correos reenviados caen en Spam de Gmail] → Filtro «No enviar nunca a Spam» y marcar «No es spam» las primeras veces.
- [Límite de Brevo (300 al día) o cambios en su plan gratuito] → Es de sobra para un negocio artesanal. Si cambiara, el SMTP se sustituye en Gmail sin tocar la web ni Email Routing.
- [La clave SMTP de Brevo se filtra] → Solo se guarda en Gmail. Si se sospecha, se revoca en Brevo y se genera otra.
- [Workers Builds no lee `.nvmrc`] → Variable `NODE_VERSION=22` en el panel (decisión 2).
- [La redirección 307 de las rutas sin barra es temporal] → Los enlaces internos, el sitemap y las canónicas usan siempre la barra final, así que los buscadores apenas ven esas redirecciones.
- [Lanzar con la galería vacía] → Es un estado diseñado (WhatsApp como llamada a la acción). El README explica cómo publicar los primeros trabajos.

## Migration Plan

1. **Repositorio**: cambios en la web y la configuración, `npm run verify`, prueba local con `npx wrangler dev`, commit y primer push a GitHub.
2. **Cloudflare**: cuenta y zona en el plan Free; DNSSEC y servidores DNS en DonDominio; espera hasta que la zona esté «Activa».
3. **Web**: Worker con Workers Builds; dominio raíz, `www` y HTTPS; comprobación de todos los requisitos de `publicacion-sitio`.
4. **Correo**: Email Routing, Brevo, DMARC y Gmail «Enviar como»; comprobación de los requisitos de `correo-profesional`.

**Vuelta atrás**:
- Web: restaurar un despliegue anterior en Workers (Deployments → Rollback).
- Correo: desactivar Email Routing o quitar la dirección en Gmail.
- DNS: volver a poner los servidores de DonDominio. Solo tendría sentido si hubiera que abandonar Cloudflare, y tarda en propagarse.
