# CUB Laser Creative — web portafolio

Web estática para mostrar los trabajos de **CUB Laser Creative** (corte láser e impresión a todo color sobre madera, Valencia) y recibir encargos por WhatsApp.

Hecha con [Astro](https://astro.build) y [Tailwind CSS](https://tailwindcss.com). No tiene base de datos ni servidor: los trabajos son carpetas con un archivo de texto y sus fotos.

## Requisitos

- Node.js 22 (la versión está en `.nvmrc`). Con nvm:

  ```sh
  nvm use
  ```

- npm (viene con Node).

La primera vez, instala las dependencias:

```sh
npm install
```

## Comandos

| Comando           | Qué hace                                                                    |
| ----------------- | --------------------------------------------------------------------------- |
| `npm run dev`     | Servidor de desarrollo en <http://localhost:4321> (muestra los borradores)  |
| `npm run build`   | Genera la web final en `dist/`                                              |
| `npm run preview` | Sirve `dist/` para revisarla tal como quedará publicada                     |
| `npm run check`   | Comprueba los tipos y la configuración                                      |
| `npm run test`    | Ejecuta los tests                                                           |
| `npm run verify`  | `check` + `test` + `build`: ejecútalo antes de publicar                     |
| `npx wrangler dev` | Sirve `dist/` como Cloudflare en producción: redirecciones, 404 y cabeceras (antes, `npm run build`) |

## Dónde está cada cosa

```
src/
  config/
    negocio.ts      ← nombre, eslogan, URL, WhatsApp, redes y datos legales
    inicio.ts       ← textos de la página de inicio
    iconos.ts       ← iconos disponibles para los textos de inicio
  content/
    categorias/     ← una categoría por archivo .yml
    trabajos/       ← un trabajo por carpeta (index.md + fotos)
  components/Logo.astro  ← logotipo de la cabecera
public/
  favicon.svg       ← icono de la pestaña del navegador
  og-default.png    ← imagen al compartir la web (1200 × 630)
  _headers          ← cabeceras de caché que aplica Cloudflare
wrangler.jsonc      ← configuración de la publicación en Cloudflare Workers
```

## Añadir un trabajo

No hace falta tocar código.

1. Crea una carpeta en `src/content/trabajos/`. Su nombre será la dirección del trabajo: la carpeta `caja-grabada` se publica en `/trabajos/caja-grabada/`. Usa minúsculas, sin acentos ni espacios (con guiones).
2. Copia dentro las fotos (por ejemplo `portada.jpg`, `detalle-1.jpg`…).
3. Crea en esa carpeta un archivo `index.md` como este:

   ```md
   ---
   titulo: Caja grabada para un aniversario
   descripcion: Caja de madera grabada con láser con los nombres de la pareja y la fecha de su aniversario.
   categoria: eventos
   fecha: 2026-10-15
   material: Contrachapado de abedul de 3 mm
   destacado: true
   portada:
     src: ./portada.jpg
     alt: Caja de madera con los nombres de la pareja grabados en la tapa
   imagenes:
     - src: ./detalle-1.jpg
       alt: Detalle del grabado de la tapa
     - src: ./detalle-2.jpg
   ---

   Aquí va la descripción larga del trabajo. Puedes escribir varios párrafos,
   usar **negrita** o listas.
   ```

4. Comprueba que se ve bien con `npm run dev` y publica: haz commit y push a `main`.

| Campo         | Obligatorio | Para qué sirve                                                                                    |
| ------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `titulo`      | Sí          | Título del trabajo                                                                                |
| `descripcion` | Sí          | Resumen para las tarjetas y Google (máximo 160 caracteres)                                        |
| `categoria`   | Sí          | Nombre del archivo de la categoría, sin `.yml` (por ejemplo `eventos`)                            |
| `fecha`       | Sí          | Fecha del trabajo (`AAAA-MM-DD`). Ordena la galería, de más reciente a más antiguo                 |
| `portada`     | Sí          | Foto principal (`src`) y su descripción para personas ciegas (`alt`)                              |
| `imagenes`    | No          | Más fotos. El `alt` es opcional; si falta se usa «título — foto N»                                |
| `videos`      | No          | Enlaces de YouTube (ver abajo)                                                                    |
| `material`    | No          | Texto libre                                                                                       |
| `destacado`   | No          | `true` para que salga en «Trabajos destacados» de la portada (máximo 6; si no marcas ninguno, salen los 6 más recientes) |
| `borrador`    | No          | `true` para que solo se vea con `npm run dev` y no se publique                                    |

Si algo está mal (una categoría que no existe, una foto que no está en la carpeta, una descripción demasiado larga…), `npm run build` se detiene y te dice qué archivo y qué campo corregir.

> **Borradores:** no aparecen en ninguna página ni en el mapa del sitio, pero Astro copia sus fotos a `dist/` con un nombre aleatorio. No dejes en borrador fotos que no deban ser públicas.

## Añadir un video de YouTube

Sube el video a YouTube (puede ser «público» u «oculto») y pega su enlace en `videos`:

```md
videos:
  - https://www.youtube.com/watch?v=XXXXXXXXXXX
  - https://youtu.be/XXXXXXXXXXX
  - https://www.youtube.com/shorts/XXXXXXXXXXX
```

Sirve cualquier forma del enlace. Los **Shorts** se muestran en vertical y el resto en horizontal. Al publicar, la tarjeta del trabajo muestra «Incluye video».

El reproductor de YouTube no se carga hasta que el visitante pulsa el botón de reproducir, y lo hace desde `youtube-nocookie.com`, el modo de privacidad mejorada. En el móvil puede hacer falta un segundo toque para que empiece a sonar.

## Crear una categoría

Crea un archivo en `src/content/categorias/`. Su nombre (sin `.yml`) es el que se usa en el campo `categoria` de los trabajos y en la dirección `/trabajos/categoria/<nombre>/`.

```yaml
# src/content/categorias/senaletica.yml
nombre: Señalética
orden: 6
descripcion: Carteles y rótulos de madera para negocios y hogares. # opcional, máx. 160 caracteres
```

`orden` decide la posición en el filtro de la galería (de menor a mayor). Una categoría sin trabajos publicados no aparece en el filtro ni tiene página.

## Fotos: tamaño recomendado

- Formato JPG (o PNG/WebP). Astro las convierte a AVIF y WebP en varios tamaños automáticamente.
- Lado largo de unos **2000–2500 px** y menos de **1,5 MB** por foto. Más grande no se ve mejor y hace el repositorio más pesado.
- La **portada** se recorta a formato **4:3 horizontal** en las tarjetas: deja el motivo centrado.
- Fondo neutro y buena luz natural ayudan a que la madera y los colores se vean como son.

## Textos de la página de inicio

Edita `src/config/inicio.ts`: titular y subtítulo del hero, diferenciales («¿Por qué CUB Laser Creative?»), pasos de «Cómo encargar tu diseño» y la llamada final. Puedes añadir o quitar diferenciales y pasos; los números se ponen solos.

Cada diferencial lleva un `icono`. Los disponibles están en `src/config/iconos.ts` (se llaman como en <https://lucide.dev/icons/>). Para usar otro, impórtalo y añádelo a esa lista; si escribes un nombre que no está, `npm run check` avisa.

## Datos del negocio

Todo está en `src/config/negocio.ts`, y ningún otro archivo repite estos datos:

- `nombre`, `eslogan`, `descripcion` (máx. 160 caracteres) y `url`.
- `ubicacion` y `zonaServicio` (para Google).
- `whatsapp.numero`: solo dígitos, con prefijo de país y sin `+` ni espacios (por ejemplo `34612345678`). Si no es válido, `npm run build` falla a propósito.
- `whatsapp.mensajeGenerico`: el texto con el que se abre WhatsApp.
- `redes`: añade la URL de cada red (`instagram`, `tiktok`, `facebook`, `youtube`). Las que no tengan URL no se muestran.
- `legal`: titular, NIF, domicilio y email para el aviso legal y la privacidad. Mientras falte alguno, cada build muestra un aviso y la página dice «pendiente de completar».

## Logotipo

El logotipo de la cabecera es texto con el degradado de la marca (`src/components/Logo.astro`). Cuando tengas el logotipo oficial en SVG:

1. Guárdalo, por ejemplo, en `src/assets/logo.svg`.
2. Sustituye el contenido de `Logo.astro` por la imagen (con `alt` igual al nombre del negocio).
3. Si quieres, actualiza también `public/favicon.svg` y `public/og-default.png` (1200 × 630 px).

## Antes de publicar

- [ ] **WhatsApp**: comprueba que `whatsapp.numero` es el correcto (`34662368153`) y prueba un botón desde el móvil.
- [x] **Datos legales**: `legal` en `src/config/negocio.ts` está completo (titular, NIF, domicilio y `hola@cublasercreative.es`).
- [ ] **Textos legales**: revisa `/aviso-legal/` y `/privacidad/`. Son una base estándar; conviene que los revise un profesional.
- [x] **URL**: `url` en `src/config/negocio.ts` es la definitiva (`https://cublasercreative.es`).
- [x] **Ejemplos**: los 5 trabajos de ejemplo están en borrador, así que la web se publica con la galería vacía («Muy pronto» y el botón de WhatsApp) y sin «Trabajos destacados» en la portada. Cuando tengas trabajos reales, añádelos y borra las carpetas de ejemplo de `src/content/trabajos/` (`llaveros-boda-ana-luis`, `placa-jubilacion-maria`, `logo-corporativo-cafeteria`, `recuerdos-comunion-lucia` y `marco-familia-garcia`).
- [ ] **Redes**: añade las URL de las redes que tengas.
- [ ] **Textos de inicio**: revisa `src/config/inicio.ts`.
- [ ] **Correo**: `hola@cublasercreative.es` recibe y envía (ver [Correo hola@](#correo-hola)).
- [ ] `npm run verify` termina sin errores.

## Publicar en Cloudflare Workers

La web se publica en **Cloudflare Workers** como recursos estáticos, sin código de servidor: es gratis, permite uso comercial y no limita el tráfico. Se usa Workers y no Cloudflare Pages porque Cloudflare lleva ahí todas las novedades.

Lo que necesita Cloudflare está en el repositorio:

- `wrangler.jsonc`: publica la carpeta `dist/`, responde a las rutas inexistentes con la página 404 (estado 404) y redirige las rutas sin barra final a la versión con barra (`/trabajos` → `/trabajos/`). Su `name` (`cub-laser-creative`) debe coincidir con el nombre del Worker en el panel.
- `public/_headers`: los archivos de `/_astro/` llevan el contenido en el nombre y se guardan en caché un año; las páginas se revalidan en cada visita, así que una publicación nueva se ve al recargar.

Para probarlo en local tal como funcionará en Cloudflare:

```sh
npm run build
npx wrangler dev
```

### Configuración inicial (una sola vez)

1. **Cuenta y dominio**: crea una cuenta en <https://dash.cloudflare.com> y añade `cublasercreative.es` en el plan **Free**. Revisa los registros DNS que importa y borra los de aparcamiento de DonDominio, si los hay. Apunta los dos servidores DNS que te asigna Cloudflare.
2. **Servidores DNS en DonDominio** (Dominios → Gestionar dominio → DNS):
   - **Primero, DNSSEC**: si hay una entrada DNSSEC, elimínala. Si la dejas, el dominio deja de funcionar para muchos usuarios al cambiar de servidores.
   - Después, **Editar servidores DNS** → servidores personalizados, con los dos de Cloudflare.
   - El cambio tarda de 6 a 12 horas. Espera a que Cloudflare marque la zona como **Activa** antes de seguir. Compruébalo con `dig NS cublasercreative.es +short`.
   - Cuando esté activa puedes volver a activar DNSSEC desde Cloudflare (DNS → Configuración) y copiar su registro DS en DonDominio («Crear entrada DNSSEC»). Es opcional.
3. **Worker conectado a GitHub**: en **Workers y Pages → Crear → Importar un repositorio**, autoriza GitHub y elige `cub-laser-creative`:
   - Nombre del Worker: `cub-laser-creative`.
   - Comando de build: `npm run build`.
   - Comando de despliegue: `npx wrangler deploy`.
   - Vistas previas de las demás ramas: Cloudflare las configura solo, en la pestaña **Base de vistas previas** de **Configuración → Compilación**, con `npx wrangler preview`. Necesitan el bloque `previews` de `wrangler.jsonc` (ya está; sin él, el build de la rama falla).
   - Node: el build lee `.nvmrc` (22). Si el registro del primer build muestra otra versión, añade la variable `NODE_VERSION` = `22` y repite.

   Cuando termine, la web estará en `https://cub-laser-creative.<tu-cuenta>.workers.dev`.
4. **Dominio y HTTPS**: en el Worker, pestaña **Dominios** → **Añadir dominio** (no «Añadir ruta») → `cublasercreative.es`. Cloudflare crea el registro DNS y el certificado. Después, en **SSL/TLS → Certificados perimetrales**, activa **Usar siempre HTTPS** (Always Use HTTPS).
5. **Redirección de `www`**:
   - En **DNS**, crea un registro `AAAA` con nombre `www`, contenido `100::` y proxy activado (nube naranja). Es un registro de relleno: la regla de redirección necesita que exista.
   - En **Reglas**, usa la plantilla **«Redirigir de WWW a raíz»** (Redirect from WWW to root): 301, conservando la ruta y los parámetros.
   - Comprueba que `curl -sI https://www.cublasercreative.es/trabajos/` devuelve un 301 a `https://cublasercreative.es/trabajos/`.
6. **Dirección `workers.dev`**: en la pestaña **Dominios**, desactiva la ruta `workers.dev` de producción si el panel permite mantener activas las URL de vista previa. Si no se pueden separar, déjala activa: las URL canónicas apuntan a `cublasercreative.es` y Google no la trata como contenido duplicado.

### Día a día

- Cada push a `main` genera y publica la web en unos minutos.
- Cada push a otra rama genera una **URL de vista previa** propia, `https://<rama>-cub-laser-creative.cublasercreative.workers.dev`, sin tocar la web publicada. No la indexan los buscadores.
- Si el build falla (una categoría que no existe, una foto que falta, un número de WhatsApp inválido…), no se publica nada y la web sigue como estaba. El error aparece en el registro del build, en el panel.

**Volver a una versión anterior:** en el Worker, pestaña **Implementaciones** (Deployments), elige una versión anterior y pulsa **Revertir** (Rollback). No hace falta volver a generar la web. Para recuperar la última, haz lo mismo con ella o un nuevo push a `main`.

**Publicar a mano** (solo si Workers Builds fallara):

```sh
npx wrangler login
npm run build
npx wrangler deploy
```

**Dejar Cloudflare** (no debería hacer falta): vuelve a poner en DonDominio sus servidores DNS. Tarda horas en propagarse y deja sin web ni correo hasta que se configuren en otro sitio.

## Correo hola@

`hola@cublasercreative.es` funciona sin buzón propio y gratis:

- **Recibir**: Cloudflare Email Routing reenvía lo que llega a `hola@` al Gmail personal.
- **Enviar y responder**: Gmail envía como `hola@` a través del servidor SMTP gratuito de Brevo (300 correos al día), con el dominio autenticado para no caer en spam.

El correo solo aparece en el aviso legal y en la política de privacidad; el contacto visible sigue siendo WhatsApp.

> **Seguridad:** la clave SMTP de Brevo solo se guarda en Gmail. No la escribas en el repositorio (es público). Si sospechas que se ha filtrado, revócala en Brevo y genera otra.

### Configuración inicial (una sola vez, con la zona ya activa en Cloudflare)

1. **Recepción con Email Routing** (Cloudflare → **Correo electrónico → Enrutamiento de correo electrónico**):
   - Actívalo y acepta los registros que propone (MX, SPF y DKIM).
   - Añade el Gmail personal como **dirección de destino** y verifícalo con el correo que manda Cloudflare.
   - Crea la regla `hola@cublasercreative.es` → Gmail.
   - Deja **desactivado el catch-all**: así quien escriba a una dirección que no existe (por ejemplo `ventas@`) recibe un aviso de entrega fallida.
   - En Gmail, crea un filtro **«Para: hola@cublasercreative.es» → No enviar nunca a Spam**. Las primeras semanas, marca como «No es spam» lo que caiga ahí.
2. **Brevo**:
   - Crea una cuenta gratuita en <https://www.brevo.com> con `hola@cublasercreative.es` (los correos de alta ya llegan al Gmail).
   - En **Remitentes, dominios e IP dedicadas → Dominios**, añade `cublasercreative.es` y autentícalo con los registros que indique Brevo (código de verificación y DKIM). Si ofrece configurarlo automáticamente con Cloudflare, úsalo.
   - **Un solo SPF**: si Brevo pide añadir su `include` al SPF, edita el registro existente en vez de crear otro. Debe quedar uno solo: `v=spf1 include:_spf.mx.cloudflare.net include:spf.brevo.com ~all`.
   - En **SMTP y API**, genera una **clave SMTP** y apunta también el **login SMTP**.
3. **DMARC** (Cloudflare → **Correo electrónico → Administración de DMARC**): actívalo para publicar `_dmarc` con `v=DMARC1; p=none` y los informes en Cloudflare, para que no lleguen al Gmail.
4. **Gmail «Enviar como»** (Configuración → Ver todos los ajustes → **Cuentas e importación → Enviar como → Añadir otra dirección de correo electrónico**):
   - Nombre: `CUB Laser Creative`; dirección: `hola@cublasercreative.es`.
   - Servidor SMTP: `smtp-relay.brevo.com`, puerto `587`, conexión segura con **TLS**. Usuario: el login SMTP de Brevo; contraseña: la clave SMTP.
   - Confirma con el código que llega a `hola@`.
   - En la misma sección, marca **«Responder desde la misma dirección a la que se envió el mensaje»**.

### Comprobaciones

```sh
dig MX cublasercreative.es +short          # route1/2/3.mx.cloudflare.net
dig TXT cublasercreative.es +short         # un único registro "v=spf1 …"
dig TXT _dmarc.cublasercreative.es +short  # "v=DMARC1; p=none; …"
```

Escribe a `hola@` desde una cuenta externa y respóndele desde Gmail como `hola@`. En la cuenta externa, el remitente debe ser `CUB Laser Creative <hola@cublasercreative.es>`, el mensaje debe llegar a la bandeja de entrada y en **Mostrar original** debe indicar `DKIM: PASS` con `cublasercreative.es` y `DMARC: PASS`.

### Después del lanzamiento

- **Endurecer DMARC**: tras 2–4 semanas de informes limpios en la Administración de DMARC de Cloudflare (todo lo legítimo pasa), cambia la política a `p=quarantine`. Así los correos que suplanten `cublasercreative.es` irán a spam.
- **Vuelta atrás**: para dejar de recibir, desactiva Email Routing o borra la regla de `hola@`. Para dejar de enviar como `hola@`, quita la dirección en Gmail «Enviar como».
