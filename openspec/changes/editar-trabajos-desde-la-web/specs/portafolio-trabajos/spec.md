# Spec Delta

## MODIFIED Requirements

### Requirement: Trabajos definidos como contenido
Cada trabajo SHALL definirse mediante una carpeta propia que contiene un archivo de contenido (datos + descripción larga) y sus fotos. El identificador público del trabajo (`<slug>`) SHALL ser el nombre de esa carpeta. Publicar un trabajo nuevo MUST NOT requerir cambios en el código del sitio.

Cada trabajo SHALL admitir estos datos:
- `titulo` (obligatorio)
- `descripcion` corta para tarjetas y buscadores (obligatoria, máximo 160 caracteres)
- `categoria` (obligatoria, debe existir como categoría)
- `fecha` de realización (obligatoria, se usa para ordenar)
- `portada`: foto principal con su texto alternativo (obligatoria)
- `imagenes`: fotos adicionales, cada una con texto alternativo opcional
- `videos`: lista de videos de YouTube (opcional)
- `instagram`: lista de publicaciones o reels públicos de Instagram (opcional)
- `material` (opcional, texto libre)
- `destacado` (opcional, por defecto `false`)
- `borrador` (opcional, por defecto `false`)

#### Scenario: Publicar un trabajo nuevo
- **WHEN** se crea la carpeta `caja-grabada` con su archivo de contenido válido y sus fotos, y se genera el sitio
- **THEN** el trabajo aparece en la galería y su ficha está disponible en `/trabajos/caja-grabada/`, sin haber modificado ningún archivo de código

#### Scenario: Trabajo sin publicaciones de Instagram
- **WHEN** un trabajo no declara `instagram`
- **THEN** se genera igual que antes de existir el campo y su ficha no muestra nada relacionado con Instagram

### Requirement: Validación del contenido en la generación del sitio
La generación del sitio MUST fallar, indicando el trabajo y el campo afectados, cuando un trabajo tenga un dato obligatorio ausente o un valor inválido: categoría inexistente, archivo de imagen inexistente, descripción de más de 160 caracteres, enlace de video que no sea de YouTube o enlace de Instagram que no sea de una publicación o un reel.

#### Scenario: Categoría inexistente
- **WHEN** un trabajo declara `categoria: posavasos` y no existe ninguna categoría `posavasos`
- **THEN** la generación del sitio falla con un mensaje que nombra el trabajo y el campo `categoria`

#### Scenario: Portada ausente
- **WHEN** un trabajo no declara `portada`
- **THEN** la generación del sitio falla con un mensaje que nombra el trabajo y el campo `portada`

#### Scenario: Video no válido
- **WHEN** un trabajo incluye en `videos` el enlace `https://vimeo.com/12345`
- **THEN** la generación del sitio falla con un mensaje que nombra el trabajo y el campo `videos`

#### Scenario: Enlace de Instagram a un perfil
- **WHEN** un trabajo incluye en `instagram` el enlace `https://www.instagram.com/cublasercreative/`, que es un perfil y no una publicación
- **THEN** la generación del sitio falla con un mensaje que nombra el trabajo y el campo `instagram`, con ejemplos de enlaces válidos

### Requirement: Ficha de trabajo
Cada trabajo publicado SHALL tener una página en `/trabajos/<slug>/` que muestre: título, categoría (enlazada a su página de categoría), material si existe, descripción larga, la portada, todas las fotos adicionales, todos los videos y todas las publicaciones de Instagram. Las secciones sin contenido (sin fotos adicionales, sin videos, sin publicaciones de Instagram, sin material) MUST NOT mostrarse vacías. La ficha SHALL incluir un enlace para volver a la galería.

#### Scenario: Trabajo con fotos y video
- **WHEN** el visitante abre la ficha de un trabajo con 3 fotos adicionales y 1 video
- **THEN** ve el título, la categoría, la descripción, la portada, las 3 fotos y el video

#### Scenario: Trabajo sin videos
- **WHEN** el visitante abre la ficha de un trabajo sin videos
- **THEN** la página no muestra ninguna sección ni título de videos

#### Scenario: Trabajo con publicaciones de Instagram
- **WHEN** el visitante abre la ficha de un trabajo con 2 publicaciones de Instagram
- **THEN** ve una sección «En Instagram» con las 2 publicaciones, debajo de los videos si los hay

## ADDED Requirements

### Requirement: Publicaciones de Instagram con consentimiento
Cada entrada de `instagram` SHALL aceptar el enlace de una publicación o un reel público en sus formas habituales (`instagram.com/p/<código>/`, `instagram.com/reel/<código>/`, con o sin el nombre de la cuenta delante y con o sin parámetros). Mientras el visitante no haya dado su permiso, la ficha MUST NOT solicitar ningún recurso a Instagram ni a Meta ni permitir que creen cookies. En su lugar, SHALL mostrar dentro de la sección «En Instagram»:
- Un enlace a cada publicación que la abre en Instagram, que funcione también sin JavaScript.
- Si el navegador tiene JavaScript, un aviso que explique que, al mostrarlas, Instagram (Meta) recibe datos del visitante y usa cookies, con un botón para aceptar y un enlace a la política de privacidad.

El aviso MUST NOT tapar el contenido de la página ni el botón de WhatsApp, y MUST NOT tener más peso visual que el botón «Quiero algo así». Al aceptar, las publicaciones SHALL mostrarse dentro de la página. La decisión SHALL recordarse en ese navegador, de modo que en las siguientes visitas las publicaciones se carguen solas sin volver a preguntar, hasta que el visitante retire el permiso.

#### Scenario: Primera visita a una ficha con Instagram
- **WHEN** un visitante que nunca ha aceptado abre una ficha con una publicación de Instagram
- **THEN** ve el aviso y el enlace a la publicación, la página no hace ninguna petición a dominios de Instagram o Meta y no hay cookies de terceros

#### Scenario: Aceptar el permiso
- **WHEN** el visitante pulsa el botón de aceptar del aviso
- **THEN** las publicaciones de Instagram se cargan dentro de la sección y el aviso desaparece

#### Scenario: Visita posterior
- **WHEN** un visitante que ya aceptó abre otra ficha con publicaciones de Instagram
- **THEN** las publicaciones se cargan solas, sin aviso

#### Scenario: Permiso retirado
- **WHEN** el visitante retira el permiso desde la política de privacidad y vuelve a abrir una ficha con Instagram
- **THEN** ve de nuevo el aviso y la página no contacta con Instagram

#### Scenario: Sin JavaScript
- **WHEN** el visitante tiene JavaScript desactivado y abre una ficha con Instagram
- **THEN** ve un enlace a cada publicación que la abre en Instagram
