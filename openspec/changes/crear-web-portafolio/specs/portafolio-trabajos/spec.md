# Spec Delta

## Purpose

Permite publicar y mostrar los trabajos de corte y grabado láser de CUB Laser Creative (fotos y videos) organizados por categorías, de forma que añadir un trabajo nuevo solo requiera crear contenido.

## ADDED Requirements

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
- `material` (opcional, texto libre)
- `destacado` (opcional, por defecto `false`)
- `borrador` (opcional, por defecto `false`)

#### Scenario: Publicar un trabajo nuevo
- **WHEN** se crea la carpeta `caja-grabada` con su archivo de contenido válido y sus fotos, y se genera el sitio
- **THEN** el trabajo aparece en la galería y su ficha está disponible en `/trabajos/caja-grabada/`, sin haber modificado ningún archivo de código

### Requirement: Validación del contenido en la generación del sitio
La generación del sitio MUST fallar, indicando el trabajo y el campo afectados, cuando un trabajo tenga un dato obligatorio ausente o un valor inválido: categoría inexistente, archivo de imagen inexistente, descripción de más de 160 caracteres o enlace de video que no sea de YouTube.

#### Scenario: Categoría inexistente
- **WHEN** un trabajo declara `categoria: posavasos` y no existe ninguna categoría `posavasos`
- **THEN** la generación del sitio falla con un mensaje que nombra el trabajo y el campo `categoria`

#### Scenario: Portada ausente
- **WHEN** un trabajo no declara `portada`
- **THEN** la generación del sitio falla con un mensaje que nombra el trabajo y el campo `portada`

#### Scenario: Video no válido
- **WHEN** un trabajo incluye en `videos` el enlace `https://vimeo.com/12345`
- **THEN** la generación del sitio falla con un mensaje que nombra el trabajo y el campo `videos`

### Requirement: Categorías definidas como contenido
Cada categoría SHALL definirse como contenido con `nombre`, `orden` y `descripcion` opcional; su identificador (`<slug>`) SHALL ser el nombre del archivo. Crear una categoría MUST NOT requerir cambios en el código. Las categorías se SHALL presentar según su `orden` ascendente.

#### Scenario: Añadir una categoría
- **WHEN** se crea la categoría `senaletica` con nombre "Señalética" y se publica un trabajo en ella
- **THEN** "Señalética" aparece en el filtro de la galería y existe la página `/trabajos/categoria/senaletica/`

### Requirement: Borradores
Los trabajos con `borrador: true` MUST NOT aparecer en el sitio publicado: ni en la galería, ni en las páginas de categoría, ni en destacados, ni en relacionados, ni en el mapa del sitio, ni como ficha. En el entorno de desarrollo local SHALL mostrarse para poder revisarlos.

#### Scenario: Borrador en producción
- **WHEN** un trabajo tiene `borrador: true` y se genera el sitio para producción
- **THEN** no existe la página `/trabajos/<slug>/` de ese trabajo y no aparece en ningún listado

#### Scenario: Borrador en desarrollo
- **WHEN** un trabajo tiene `borrador: true` y se ejecuta el servidor de desarrollo
- **THEN** el trabajo aparece en la galería y su ficha es accesible

### Requirement: Galería de trabajos
La página `/trabajos/` SHALL listar todos los trabajos publicados ordenados por `fecha` descendente. Cada trabajo SHALL mostrarse como una tarjeta con su portada, título, nombre de la categoría y un indicador visible cuando el trabajo tenga al menos un video. La tarjeta completa SHALL enlazar a la ficha del trabajo. Si no hay trabajos publicados, la página SHALL mostrar un mensaje invitando a contactar por WhatsApp.

#### Scenario: Orden de la galería
- **WHEN** existen los trabajos A (fecha 2026-03-01) y B (fecha 2026-05-10)
- **THEN** en `/trabajos/` la tarjeta de B aparece antes que la de A

#### Scenario: Indicador de video
- **WHEN** un trabajo tiene al menos un video
- **THEN** su tarjeta muestra un indicador de video con texto accesible (por ejemplo, "Incluye video")

### Requirement: Filtro por categoría sin JavaScript
La galería SHALL mostrar un filtro con la opción "Todos" y una opción por cada categoría que tenga al menos un trabajo publicado. Cada opción SHALL ser un enlace a una página propia: "Todos" a `/trabajos/` y cada categoría a `/trabajos/categoria/<slug>/`, que lista solo los trabajos de esa categoría con el mismo orden y formato que la galería. La opción activa SHALL marcarse visualmente y para tecnologías de asistencia. El filtro MUST funcionar con JavaScript desactivado. Las categorías sin trabajos publicados MUST NOT aparecer en el filtro ni generar página.

#### Scenario: Filtrar por categoría
- **WHEN** el visitante pulsa la opción "Grabado" del filtro
- **THEN** navega a `/trabajos/categoria/grabado/`, que muestra solo trabajos de esa categoría, y la opción "Grabado" aparece marcada como actual

#### Scenario: Categoría vacía
- **WHEN** una categoría no tiene ningún trabajo publicado
- **THEN** no aparece en el filtro y no existe su página de categoría

### Requirement: Ficha de trabajo
Cada trabajo publicado SHALL tener una página en `/trabajos/<slug>/` que muestre: título, categoría (enlazada a su página de categoría), material si existe, descripción larga, la portada, todas las fotos adicionales y todos los videos. Las secciones sin contenido (sin fotos adicionales, sin videos, sin material) MUST NOT mostrarse vacías. La ficha SHALL incluir un enlace para volver a la galería.

#### Scenario: Trabajo con fotos y video
- **WHEN** el visitante abre la ficha de un trabajo con 3 fotos adicionales y 1 video
- **THEN** ve el título, la categoría, la descripción, la portada, las 3 fotos y el video

#### Scenario: Trabajo sin videos
- **WHEN** el visitante abre la ficha de un trabajo sin videos
- **THEN** la página no muestra ninguna sección ni título de videos

### Requirement: Trabajos relacionados
La ficha de trabajo SHALL mostrar hasta 3 trabajos publicados de la misma categoría, excluyendo el actual, ordenados por fecha descendente. Si no hay otros trabajos en la categoría, la sección MUST NOT mostrarse.

#### Scenario: Categoría con varios trabajos
- **WHEN** la categoría del trabajo actual tiene otros 5 trabajos publicados
- **THEN** la ficha muestra los 3 más recientes de esos 5

### Requirement: Selección de trabajos destacados
El sitio SHALL ofrecer una selección de hasta 6 trabajos destacados: los trabajos publicados con `destacado: true`, ordenados por fecha descendente. Si ningún trabajo está marcado como destacado, la selección SHALL contener los 6 trabajos publicados más recientes.

#### Scenario: Sin destacados marcados
- **WHEN** ningún trabajo tiene `destacado: true` y hay 10 trabajos publicados
- **THEN** la selección de destacados contiene los 6 más recientes

### Requirement: Fotos optimizadas y accesibles
Las fotos SHALL servirse en formatos modernos y en varios tamaños según el ancho de pantalla, con dimensiones declaradas para evitar saltos de contenido durante la carga. Las fotos que no son visibles al cargar la página SHALL cargarse de forma diferida. Toda foto SHALL tener texto alternativo: el de la portada es obligatorio; si una foto adicional no lo declara, SHALL usarse "<título del trabajo> — foto <n>".

#### Scenario: Foto adicional sin texto alternativo
- **WHEN** la segunda foto adicional del trabajo "Caja grabada" no declara texto alternativo
- **THEN** la foto se muestra con el texto alternativo "Caja grabada — foto 2"

### Requirement: Videos de YouTube con carga bajo demanda
Cada entrada de `videos` SHALL aceptar un enlace de YouTube en cualquiera de sus formas habituales (`youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`) o el identificador del video. El reproductor de YouTube MUST NOT cargarse hasta que el visitante active el video; antes de eso SHALL mostrarse solo una imagen de previsualización con un botón de reproducción accesible por teclado. Al activarlo, el video SHALL reproducirse dentro de la página usando el dominio de privacidad mejorada de YouTube. Los videos con enlace de Shorts SHALL mostrarse en formato vertical (9:16) y el resto en horizontal (16:9).

#### Scenario: Añadir un video a un trabajo existente
- **WHEN** se pega un enlace de YouTube en `videos` de un trabajo que no tenía videos y se regenera el sitio
- **THEN** el video aparece en la ficha del trabajo y su tarjeta muestra el indicador de video, sin haber modificado ningún archivo de código

#### Scenario: Carga de una ficha con video
- **WHEN** el visitante abre una ficha con un video y no interactúa con él
- **THEN** la página no contiene ningún reproductor ni script de YouTube, solo la previsualización con el botón de reproducir

#### Scenario: Reproducir un video
- **WHEN** el visitante pulsa (o activa con teclado) el botón de reproducir
- **THEN** el video se reproduce dentro de la página desde `youtube-nocookie.com`

#### Scenario: Short de YouTube
- **WHEN** un video se declara como `https://www.youtube.com/shorts/AbC123xyz_0`
- **THEN** se muestra en formato vertical 9:16
