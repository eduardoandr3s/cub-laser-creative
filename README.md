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

4. Comprueba que se ve bien con `npm run dev` y publica.

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
- [ ] **Datos legales**: completa `legal` en `src/config/negocio.ts` (titular, NIF, domicilio y email).
- [ ] **Textos legales**: revisa `/aviso-legal/` y `/privacidad/`. Son una base estándar; conviene que los revise un profesional.
- [ ] **URL**: `url` en `src/config/negocio.ts` debe ser la definitiva (`https://cublasercreative.es`).
- [ ] **Ejemplos**: borra las carpetas de ejemplo de `src/content/trabajos/` (`llaveros-boda-ana-luis`, `placa-jubilacion-maria`, `logo-corporativo-cafeteria`, `recuerdos-comunion-lucia` y `marco-familia-garcia`) y sus videos de ejemplo, y añade tus trabajos reales.
- [ ] **Redes**: añade las URL de las redes que tengas.
- [ ] **Textos de inicio**: revisa `src/config/inicio.ts`.
- [ ] `npm run verify` termina sin errores.

## Publicar en Cloudflare Pages

Cloudflare Pages es gratuito, permite uso comercial y no limita el tráfico.

1. **Sube el proyecto a GitHub** (por ejemplo, un repositorio privado `cub-laser-creative`) y haz push de la rama `main`.
2. Entra en <https://dash.cloudflare.com> y crea una cuenta si no la tienes.
3. Ve a **Workers y Pages → Crear → Pages → Conectar a Git**, autoriza GitHub y elige el repositorio.
4. Configura la compilación:
   - Framework: **Astro**
   - Comando de compilación: `npm run build`
   - Directorio de salida: `dist`
   - Node: Cloudflare lee la versión de `.nvmrc` (22). Si no, añade la variable de entorno `NODE_VERSION` = `22`.
5. Pulsa **Guardar e implementar**. Cuando termine, la web estará en `https://<proyecto>.pages.dev`.
6. **Dominio propio**: en el proyecto, **Dominios personalizados → Configurar un dominio** y escribe `cublasercreative.es`. Para usar el dominio sin `www`, el dominio tiene que estar gestionado en Cloudflare: añádelo como sitio en Cloudflare y cambia los servidores DNS (nameservers) en el registrador donde lo compraste por los que te indique Cloudflare. Añade también `www.cublasercreative.es` y una regla de redirección de `www` a la versión sin `www`.

A partir de ahí, cada push a `main` publica la web automáticamente, y cada rama genera una URL de vista previa.

**Volver a una versión anterior:** en el proyecto de Cloudflare Pages, pestaña **Implementaciones**, elige una anterior y pulsa **Revertir**.
