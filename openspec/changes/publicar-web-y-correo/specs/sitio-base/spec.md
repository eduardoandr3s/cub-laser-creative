# Spec Delta

## MODIFIED Requirements

### Requirement: Página de inicio
La página `/` SHALL mostrar, en este orden:
1. **Hero**: titular sobre regalos personalizados y recuerdos a todo color con tecnología láser, el eslogan, un botón para escribir por WhatsApp (mensaje genérico) y un botón "Ver trabajos" que lleva a `/trabajos/`.
2. **¿Por qué CUB Laser Creative?**: los diferenciales del negocio (por ejemplo, corte láser de precisión e impresión a todo color sobre madera real), cada uno con icono, título y texto breve.
3. **Trabajos destacados**: la selección de destacados en tarjetas con el mismo formato que la galería y un enlace a `/trabajos/`. Si no hay ningún trabajo publicado, esta sección MUST NOT mostrarse, ni siquiera su título.
4. **Cómo encargar tu diseño**: pasos numerados del proceso de pedido, desde el primer mensaje hasta la entrega.
5. **Llamada final** para contactar por WhatsApp.

Los textos de estas secciones (titular, diferenciales y pasos) SHALL editarse en un único archivo de contenido, separado de los componentes.

#### Scenario: Visita a la página de inicio
- **WHEN** el visitante abre `/`
- **THEN** ve el hero con los dos botones, los diferenciales, los trabajos destacados, los pasos para encargar y la llamada final a WhatsApp

#### Scenario: Añadir un paso al proceso
- **WHEN** se añade un quinto paso en el archivo de textos de inicio y se regenera el sitio
- **THEN** la sección "Cómo encargar tu diseño" muestra cinco pasos numerados sin haber modificado ningún componente

#### Scenario: Sin trabajos publicados
- **WHEN** todos los trabajos están en borrador y se genera el sitio para producción
- **THEN** la página `/` muestra el hero, los diferenciales, los pasos y la llamada final, y no muestra la sección "Trabajos destacados"

### Requirement: Páginas legales
El sitio SHALL publicar `/aviso-legal/` y `/privacidad/`, generadas con los datos legales del titular de la configuración del negocio y enlazadas desde el pie de todas las páginas. El correo electrónico del titular SHALL mostrarse en ambas páginas. La política de privacidad SHALL indicar que el sitio no usa cookies ni formularios, que el contacto se realiza a través de WhatsApp o del correo electrónico del titular, y qué proveedores tratan los mensajes de cada canal. Si falta algún dato legal, la generación del sitio SHALL mostrar un aviso en la consola que nombre los campos ausentes.

#### Scenario: Consulta del aviso legal
- **WHEN** el visitante pulsa "Aviso legal" en el pie
- **THEN** ve una página con el titular, NIF, domicilio y correo electrónico configurados

#### Scenario: Dato legal ausente
- **WHEN** la configuración no incluye el NIF y se genera el sitio
- **THEN** la consola muestra un aviso indicando que falta el NIF

#### Scenario: Contacto por correo en la política de privacidad
- **WHEN** el visitante lee `/privacidad/`
- **THEN** encuentra el correo `hola@cublasercreative.es` como canal de contacto junto a WhatsApp, y los proveedores que tratan los mensajes de correo

## ADDED Requirements

### Requirement: Redes junto a los botones de WhatsApp
La llamada final de la página de inicio y la ficha de cada trabajo SHALL mostrar, debajo de su botón de WhatsApp, las redes configuradas como enlaces secundarios: solo icono, sin relleno, con nombre accesible y un área táctil mínima de 44×44 px. El botón de WhatsApp SHALL seguir siendo la acción destacada. Si no hay ninguna red configurada, ese bloque MUST NOT mostrarse.

#### Scenario: Redes en la ficha de un trabajo
- **WHEN** Instagram y TikTok están configurados y el visitante abre la ficha de un trabajo
- **THEN** debajo del botón "Quiero algo así" ve los iconos de Instagram y TikTok, y cada uno abre su perfil en una pestaña nueva

#### Scenario: Sin redes configuradas
- **WHEN** no hay ninguna red configurada
- **THEN** ni la llamada final de inicio ni las fichas de trabajo muestran el bloque de redes
