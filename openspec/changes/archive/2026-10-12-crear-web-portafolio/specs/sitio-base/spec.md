# Spec Delta

## Purpose

Define la estructura común del sitio de CUB Laser Creative (configuración del negocio, identidad visual, layout, inicio, páginas legales, 404, SEO técnico y local) y los requisitos transversales de accesibilidad, rendimiento, privacidad y despliegue estático.

## ADDED Requirements

### Requirement: Configuración centralizada del negocio
Los datos del negocio SHALL declararse en un único lugar de configuración: nombre, eslogan, descripción corta, URL pública del sitio, ubicación (localidad, provincia, país), número de WhatsApp, mensaje genérico de WhatsApp, enlaces opcionales a redes sociales (Instagram, TikTok, Facebook, YouTube) y datos legales del titular (nombre o razón social, NIF, domicilio y correo electrónico). Ningún otro archivo del sitio MUST repetir estos valores. Las redes sociales no configuradas MUST NOT mostrarse.

#### Scenario: Cambio de eslogan
- **WHEN** se modifica el eslogan en la configuración y se regenera el sitio
- **THEN** el nuevo eslogan aparece en todas las páginas que lo muestran

#### Scenario: Red social no configurada
- **WHEN** la configuración solo incluye Instagram
- **THEN** el pie de página muestra el enlace a Instagram y ningún enlace o icono de las demás redes

### Requirement: Identidad visual de marca
La cabecera SHALL mostrar el logotipo de la marca: "CUB" en negrita, con las letras U y B rellenas de un degradado cian (`#00A3FF`) → magenta (`#E6007A`) → ámbar (`#FFB800`), acompañado del subtítulo "LÁSER CREATIVE — Corte y Grabado a Todo Color" (el subtítulo puede ocultarse en pantallas estrechas). Si se aporta el logotipo oficial como archivo de imagen, SHALL sustituir al logotipo textual sin cambiar el resto del sitio. El sitio SHALL usar la paleta de la marca (cian, magenta, ámbar, neutro oscuro `#0F172A` y fondos claros con tonos cálidos de madera) sin incumplir los contrastes del requisito de accesibilidad: el cian y el ámbar MUST NOT usarse como color de texto sobre fondos claros ni como fondo de texto blanco.

#### Scenario: Logotipo en la cabecera
- **WHEN** el visitante abre cualquier página
- **THEN** la cabecera muestra "CUB" con el degradado en las letras U y B, y el logotipo enlaza a la página de inicio

#### Scenario: Botón con color de marca
- **WHEN** un botón usa el cian o el ámbar de la marca como fondo
- **THEN** su texto es del neutro oscuro y alcanza un contraste mínimo de 4,5:1

### Requirement: Estructura común de página
Todas las páginas SHALL compartir una cabecera con el logotipo y navegación a "Inicio" y "Trabajos", con la sección actual marcada visualmente y para tecnologías de asistencia. Todas las páginas SHALL compartir un pie con: el nombre del negocio, la ubicación, un enlace directo a WhatsApp, las redes sociales configuradas, enlaces a "Aviso legal" y "Privacidad" y el año de generación del sitio.

#### Scenario: Navegación en la galería
- **WHEN** el visitante está en `/trabajos/` o en cualquier página bajo `/trabajos/`
- **THEN** el enlace "Trabajos" de la navegación aparece marcado como sección actual

#### Scenario: Contenido del pie
- **WHEN** el visitante llega al final de cualquier página
- **THEN** el pie muestra la ubicación, el enlace a WhatsApp, las redes configuradas y los enlaces a "Aviso legal" y "Privacidad"

### Requirement: Página de inicio
La página `/` SHALL mostrar, en este orden:
1. **Hero**: titular sobre regalos personalizados y recuerdos a todo color con tecnología láser, el eslogan, un botón para escribir por WhatsApp (mensaje genérico) y un botón "Ver trabajos" que lleva a `/trabajos/`.
2. **¿Por qué CUB Laser Creative?**: los diferenciales del negocio (por ejemplo, corte láser de precisión e impresión a todo color sobre madera real), cada uno con icono, título y texto breve.
3. **Trabajos destacados**: la selección de destacados en tarjetas con el mismo formato que la galería y un enlace a `/trabajos/`.
4. **Cómo encargar tu diseño**: pasos numerados del proceso de pedido, desde el primer mensaje hasta la entrega.
5. **Llamada final** para contactar por WhatsApp.

Los textos de estas secciones (titular, diferenciales y pasos) SHALL editarse en un único archivo de contenido, separado de los componentes.

#### Scenario: Visita a la página de inicio
- **WHEN** el visitante abre `/`
- **THEN** ve el hero con los dos botones, los diferenciales, los trabajos destacados, los pasos para encargar y la llamada final a WhatsApp

#### Scenario: Añadir un paso al proceso
- **WHEN** se añade un quinto paso en el archivo de textos de inicio y se regenera el sitio
- **THEN** la sección "Cómo encargar tu diseño" muestra cinco pasos numerados sin haber modificado ningún componente

### Requirement: Páginas legales
El sitio SHALL publicar `/aviso-legal/` y `/privacidad/`, generadas con los datos legales del titular de la configuración del negocio y enlazadas desde el pie de todas las páginas. La política de privacidad SHALL indicar que el sitio no usa cookies ni formularios y que el contacto se realiza a través de WhatsApp. Si falta algún dato legal, la generación del sitio SHALL mostrar un aviso en la consola que nombre los campos ausentes.

#### Scenario: Consulta del aviso legal
- **WHEN** el visitante pulsa "Aviso legal" en el pie
- **THEN** ve una página con el titular, NIF, domicilio y correo electrónico configurados

#### Scenario: Dato legal ausente
- **WHEN** la configuración no incluye el NIF y se genera el sitio
- **THEN** la consola muestra un aviso indicando que falta el NIF

### Requirement: Página de error 404
Las rutas inexistentes SHALL responder con una página 404 propia, con la estructura común del sitio, un mensaje en español y enlaces a la página de inicio y a la galería.

#### Scenario: Ruta inexistente
- **WHEN** el visitante abre `/trabajos/no-existe/`
- **THEN** ve la página 404 del sitio con enlaces a inicio y a trabajos

### Requirement: Metadatos para buscadores y redes sociales
Cada página SHALL declarar `lang="es"`, un título único, una meta descripción de 160 caracteres como máximo, una URL canónica absoluta y metadatos Open Graph (título, descripción, URL e imagen). El título de la página de inicio SHALL ser "<nombre> — <eslogan>"; el del resto, "<título de la página> | <nombre>". La ficha de un trabajo SHALL usar su `descripcion` como meta descripción y su portada como imagen Open Graph; el resto de páginas SHALL usar una imagen Open Graph por defecto con la marca.

#### Scenario: Compartir una ficha por WhatsApp
- **WHEN** se comparte el enlace de `/trabajos/caja-grabada/` en una app que muestra vistas previas
- **THEN** la vista previa muestra el título del trabajo, su descripción y su portada

### Requirement: Datos estructurados de negocio local
La página de inicio SHALL incluir datos estructurados Schema.org de tipo `LocalBusiness` en JSON-LD, con nombre, descripción, URL, logotipo, imagen, teléfono, dirección (localidad, provincia y país), zona de servicio y enlaces a las redes sociales configuradas, generados a partir de la configuración del negocio.

#### Scenario: Validación de datos estructurados
- **WHEN** se analiza la página de inicio publicada con la Prueba de resultados enriquecidos de Google o el validador de Schema.org
- **THEN** se detecta una entidad `LocalBusiness` sin errores, con dirección en Valencia, España

### Requirement: Mapa del sitio y robots
El sitio SHALL publicar `/sitemap-index.xml` (o equivalente) con todas las páginas publicadas, excluyendo la página 404 y los borradores, y un `/robots.txt` que permita el rastreo y referencie el mapa del sitio.

#### Scenario: Contenido del mapa del sitio
- **WHEN** se genera el sitio con 4 trabajos publicados y 1 borrador
- **THEN** el mapa del sitio incluye las 4 fichas publicadas y no incluye la del borrador ni la 404

### Requirement: Diseño adaptable
Todas las páginas SHALL ser usables desde 320 px de ancho, sin desplazamiento horizontal, con diseño pensado primero para móvil y adaptado a tablet y escritorio.

#### Scenario: Pantalla estrecha
- **WHEN** se visita cualquier página con un ancho de 320 px
- **THEN** todo el contenido es legible y no aparece barra de desplazamiento horizontal

### Requirement: Accesibilidad
El sitio SHALL usar regiones semánticas (cabecera, navegación, contenido principal, pie), un enlace "Saltar al contenido" como primer elemento enfocable, foco visible en todos los elementos interactivos y navegación completa por teclado. El contraste SHALL cumplir WCAG 2.2 AA: 4,5:1 para texto normal y 3:1 para texto grande e iconos que transmiten información. Los iconos decorativos SHALL ocultarse a las tecnologías de asistencia.

#### Scenario: Navegación por teclado
- **WHEN** el visitante recorre la página de inicio solo con la tecla Tab
- **THEN** el primer elemento enfocado es "Saltar al contenido" y todos los enlaces y botones son alcanzables con foco visible

### Requirement: Rendimiento y privacidad
Las páginas MUST NOT incluir JavaScript en el cliente, salvo el estrictamente necesario para activar videos en páginas que tengan videos. Al cargar una página, el sitio MUST NOT solicitar recursos a dominios de terceros, salvo las imágenes de previsualización de YouTube en páginas con videos; las tipografías e iconos SHALL servirse desde el propio sitio. El sitio MUST NOT crear cookies propias ni de terceros mientras el visitante no active un video. Las páginas de inicio, galería y ficha de trabajo SHALL obtener al menos 90 en rendimiento, accesibilidad, buenas prácticas y SEO en una auditoría Lighthouse para móvil.

#### Scenario: Página sin videos
- **WHEN** se carga la galería `/trabajos/`
- **THEN** la página no descarga ningún archivo JavaScript, no hace peticiones a dominios externos y no crea cookies

#### Scenario: Auditoría de rendimiento
- **WHEN** se audita con Lighthouse (móvil) la ficha de un trabajo con video
- **THEN** las cuatro puntuaciones son iguales o superiores a 90

### Requirement: Sitio completamente estático
La generación del sitio SHALL producir únicamente archivos estáticos (HTML, CSS, imágenes, tipografías y, en su caso, el JavaScript de los videos) que puedan servirse desde un hosting estático sin servidor de aplicación ni base de datos.

#### Scenario: Despliegue en hosting estático
- **WHEN** se suben los archivos generados a un hosting estático
- **THEN** todas las páginas, rutas de categorías, fichas, páginas legales y la 404 funcionan sin ningún proceso de servidor
