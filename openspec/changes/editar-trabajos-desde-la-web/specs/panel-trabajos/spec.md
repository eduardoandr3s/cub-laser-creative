# Spec Delta

## Purpose

Permite que las personas autorizadas por el titular creen, editen y eliminen trabajos del portafolio desde el navegador, también desde el móvil, sin cuenta de GitHub y sin tocar código, guardando el contenido en el repositorio del sitio para que se publique como cualquier otro cambio.

## ADDED Requirements

### Requirement: Acceso solo para personas invitadas
El panel SHALL servirse en `/admin/`. Para entrar SHALL bastar una dirección de correo invitada por el titular y un código de un solo uso enviado a esa dirección, sin cuenta de GitHub ni contraseña. Las direcciones no invitadas MUST NOT poder entrar. Toda petición al panel o a su servicio de guardado sin una sesión válida MUST rechazarse sin devolver contenido ni modificar nada, también cuando llegue por una URL distinta del dominio de producción (por ejemplo, una vista previa).

#### Scenario: Entrada de una persona invitada
- **WHEN** una persona invitada abre `https://cublasercreative.es/admin/`, escribe su correo e introduce el código que recibe
- **THEN** ve el panel con la lista de trabajos

#### Scenario: Correo no invitado
- **WHEN** alguien escribe en la pantalla de acceso una dirección que no está invitada
- **THEN** no recibe un código válido y no puede ver el panel

#### Scenario: Petición directa sin sesión
- **WHEN** se envía una petición de guardado al servicio del panel sin sesión, o con una sesión caducada o falsificada
- **THEN** la respuesta es un error de acceso y el repositorio no cambia

### Requirement: Lista de trabajos
El panel SHALL mostrar todos los trabajos del repositorio, incluidos los borradores, ordenados por fecha descendente. Cada uno SHALL mostrar su portada en miniatura, título, fecha y si es borrador o está publicado. Los trabajos publicados SHALL tener un enlace a su ficha en la web. La lista SHALL ofrecer la acción de crear un trabajo nuevo.

#### Scenario: Lista con un borrador
- **WHEN** el repositorio tiene 3 trabajos publicados y 1 borrador
- **THEN** el panel lista los 4, y el borrador aparece marcado como «Borrador» y sin enlace a la web

### Requirement: Formulario de un trabajo
El panel SHALL permitir editar todos los datos de un trabajo: título, descripción corta, categoría (elegida entre las categorías existentes), fecha, material, texto largo, destacado, borrador, portada con su texto alternativo, fotos adicionales con texto alternativo opcional, enlaces de videos de YouTube y enlaces de publicaciones de Instagram. Las fotos adicionales y los enlaces SHALL poder añadirse, quitarse y reordenarse, y cualquier foto adicional SHALL poder pasar a ser la portada. El formulario SHALL indicar los caracteres que quedan en la descripción corta.

#### Scenario: Añadir un enlace de Instagram a un trabajo existente
- **WHEN** la persona editora abre un trabajo, pega el enlace de un reel de Instagram y guarda
- **THEN** el trabajo guardado incluye ese enlace en su lista de publicaciones de Instagram y el resto de sus datos no cambia

#### Scenario: Cambiar la portada
- **WHEN** la persona editora elige «Usar como portada» en la segunda foto adicional y guarda
- **THEN** esa foto pasa a ser la portada, y la antigua portada queda como foto adicional

### Requirement: Crear un trabajo
Al crear un trabajo, el panel SHALL proponer como identificador (la parte final de su URL) una versión del título en minúsculas, sin tildes ni espacios. La persona editora SHALL poder corregirlo antes del primer guardado. El identificador MUST NOT coincidir con el de otro trabajo existente y MUST NOT cambiar después del primer guardado. Un trabajo nuevo SHALL guardarse marcado como borrador, salvo que la persona editora desmarque la casilla.

#### Scenario: Identificador propuesto
- **WHEN** se crea un trabajo con el título «Caja grabada para Lucía»
- **THEN** el panel propone el identificador `caja-grabada-para-lucia` y, al guardar, el trabajo queda en `/trabajos/caja-grabada-para-lucia/` cuando se publique

#### Scenario: Identificador repetido
- **WHEN** se intenta crear un trabajo con el identificador de uno que ya existe
- **THEN** el panel no permite guardar y explica que el identificador ya está en uso

### Requirement: Eliminar un trabajo
El panel SHALL permitir eliminar un trabajo, con todas sus fotos, después de una confirmación explícita que nombre el trabajo. El panel SHALL recordar que marcarlo como borrador lo oculta sin borrarlo.

#### Scenario: Eliminación confirmada
- **WHEN** la persona editora pulsa «Eliminar» en un trabajo y confirma
- **THEN** el trabajo y sus fotos desaparecen del repositorio y, tras la publicación, su ficha deja de existir en la web

#### Scenario: Eliminación cancelada
- **WHEN** la persona editora pulsa «Eliminar» y cancela la confirmación
- **THEN** el trabajo no cambia

### Requirement: Fotos reducidas y sin metadatos
Las fotos SHALL poder elegirse desde los archivos del dispositivo o, en el móvil, desde la cámara o la galería. Antes de subirlas, el panel SHALL reducirlas a un máximo de 2400 píxeles en su lado mayor, respetando la orientación con que se hicieron, y SHALL eliminar sus metadatos (incluida la ubicación GPS). Si el navegador no puede leer una foto, el panel SHALL explicar el problema y MUST NOT guardarla. Las fotos que se quiten de un trabajo SHALL eliminarse del repositorio al guardar.

#### Scenario: Foto grande del móvil
- **WHEN** se sube una foto de 4032×3024 píxeles hecha con el móvil en vertical y con ubicación GPS
- **THEN** la foto guardada mide 1800×2400 píxeles, se ve en vertical y no contiene datos de ubicación

#### Scenario: Quitar una foto adicional
- **WHEN** se quita una de las tres fotos adicionales de un trabajo y se guarda
- **THEN** el archivo de esa foto ya no está en el repositorio y el trabajo tiene dos fotos adicionales

### Requirement: Validación antes de guardar
El panel SHALL aplicar las mismas reglas que la generación del sitio antes de guardar: título, descripción corta (máximo 160 caracteres), categoría existente, fecha válida y portada con texto alternativo obligatorios, y enlaces de YouTube e Instagram válidos. Cada error SHALL mostrarse junto a su campo con un texto que explique cómo corregirlo, y el panel MUST NOT guardar mientras haya errores.

#### Scenario: Enlace que no es de YouTube
- **WHEN** se pega `https://vimeo.com/12345` como video y se pulsa «Guardar»
- **THEN** el panel no guarda y muestra junto a ese enlace que no es un enlace de YouTube, con ejemplos de enlaces válidos

#### Scenario: Descripción demasiado larga
- **WHEN** la descripción corta tiene 161 caracteres
- **THEN** el panel indica que sobra 1 carácter y no permite guardar

### Requirement: Guardado en el repositorio
Cada guardado SHALL registrar en la rama de producción del repositorio un único cambio (commit) con todos los archivos afectados del trabajo: su contenido, las fotos nuevas y las fotos eliminadas. El contenido SHALL mantener el mismo formato que los trabajos escritos a mano, para que la generación del sitio lo valide igual. El historial público del repositorio MUST NOT incluir el correo de la persona editora.

#### Scenario: Guardar un trabajo con fotos nuevas
- **WHEN** se añaden dos fotos a un trabajo, se cambia su título y se guarda
- **THEN** el repositorio tiene un único commit nuevo que contiene el contenido actualizado y las dos fotos

### Requirement: Aviso de publicación
Después de guardar, el panel SHALL informar del estado: «Publicando…» mientras la web todavía no incluye el cambio, y «Publicado» cuando la versión publicada ya lo incluye. Si el trabajo está en borrador, el panel SHALL indicar que se ha guardado pero que no se verá en la web. Si pasados 5 minutos la web no incluye el cambio, el panel SHALL avisar de que la publicación puede haber fallado y de que el sitio sigue mostrando la versión anterior.

#### Scenario: Publicación correcta
- **WHEN** se guarda un trabajo publicado y la generación del sitio termina bien
- **THEN** el panel pasa de «Publicando…» a «Publicado» sin recargar la página

#### Scenario: Publicación fallida
- **WHEN** se guarda un cambio y la generación del sitio falla
- **THEN** pasados 5 minutos el panel avisa de que la web no se ha actualizado

### Requirement: Cambios simultáneos
Si un trabajo ha cambiado en el repositorio después de que la persona editora lo abriera (por otra persona o por un cambio en el código), el panel MUST NOT sobrescribirlo al guardar. SHALL avisar de que el trabajo ha cambiado y ofrecer volver a cargarlo, sin perder lo escrito hasta poder copiarlo.

#### Scenario: Dos personas editan el mismo trabajo
- **WHEN** la persona A y la persona B abren el mismo trabajo, A guarda y después B guarda
- **THEN** el guardado de B no se aplica y B ve un aviso de que el trabajo ha cambiado

### Requirement: Alcance limitado de los cambios
El panel MUST NOT crear, modificar ni eliminar ningún archivo del repositorio fuera de la carpeta del trabajo que se está guardando o eliminando. Los nombres de los archivos que escribe SHALL limitarse al archivo de contenido del trabajo y a fotos JPEG, PNG o WebP con nombres en minúsculas, sin espacios ni rutas.

#### Scenario: Petición manipulada
- **WHEN** una persona con sesión válida envía al servicio de guardado una petición que intenta escribir `src/config/negocio.ts` o `../otro-trabajo/index.md`
- **THEN** la petición se rechaza y el repositorio no cambia

### Requirement: Credenciales fuera del navegador
La credencial que permite escribir en el repositorio SHALL guardarse solo en el servidor y MUST NOT enviarse al navegador ni aparecer en el repositorio. Esa credencial SHALL limitarse al repositorio del sitio y SHALL poder revocarse sin afectar a la web publicada.

#### Scenario: Inspección del panel
- **WHEN** una persona con sesión revisa en las herramientas del navegador todo lo que el panel descarga
- **THEN** no encuentra la credencial de GitHub

### Requirement: Panel fuera de los buscadores
El panel MUST NOT aparecer en el mapa del sitio, SHALL marcarse para que los buscadores no lo indexen y SHALL bloquearse para los rastreadores en `robots.txt`.

#### Scenario: Revisión del mapa del sitio
- **WHEN** se genera el sitio
- **THEN** el mapa del sitio no contiene ninguna URL bajo `/admin/` y `robots.txt` incluye `Disallow: /admin/`

### Requirement: Uso desde el móvil
El panel SHALL ser usable desde 320 px de ancho, con controles de al menos 44×44 px, foco visible y etiquetas asociadas a cada campo, y SHALL poder completarse solo con teclado.

#### Scenario: Subir un trabajo desde el móvil
- **WHEN** la persona editora crea un trabajo desde un móvil, haciendo la foto de portada con la cámara
- **THEN** puede completar y guardar el trabajo sin desplazamiento horizontal ni zoom

### Requirement: Panel sin coste
El acceso, el servicio de guardado y la publicación de los cambios del panel SHALL funcionar con planes gratuitos, con capacidad para al menos 5 personas invitadas y 50 guardados al día. Su uso MUST NOT limitar ni encarecer el servicio de las páginas públicas.

#### Scenario: Revisión de la facturación
- **WHEN** el titular revisa sus cuentas tras un mes usando el panel
- **THEN** todos los servicios usados están en el plan gratuito y no hay cargos
