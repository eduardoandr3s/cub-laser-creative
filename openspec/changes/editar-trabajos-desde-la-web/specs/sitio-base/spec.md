# Spec Delta

## MODIFIED Requirements

### Requirement: Páginas legales
El sitio SHALL publicar `/aviso-legal/` y `/privacidad/`, generadas con los datos legales del titular de la configuración del negocio y enlazadas desde el pie de todas las páginas. El correo electrónico del titular SHALL mostrarse en ambas páginas. La política de privacidad SHALL indicar:
- Que el sitio no usa cookies propias ni formularios para los visitantes.
- Que las publicaciones de Instagram solo se cargan si el visitante lo acepta, qué datos recibe entonces Meta y que Meta puede crear sus propias cookies.
- Cómo retirar ese permiso, con un control en la propia página que lo retire y muestre si está concedido.
- Que el contacto se realiza a través de WhatsApp o del correo electrónico del titular, y qué proveedores tratan los mensajes de cada canal.

Si falta algún dato legal, la generación del sitio SHALL mostrar un aviso en la consola que nombre los campos ausentes.

#### Scenario: Consulta del aviso legal
- **WHEN** el visitante pulsa "Aviso legal" en el pie
- **THEN** ve una página con el titular, NIF, domicilio y correo electrónico configurados

#### Scenario: Dato legal ausente
- **WHEN** la configuración no incluye el NIF y se genera el sitio
- **THEN** la consola muestra un aviso indicando que falta el NIF

#### Scenario: Contacto por correo en la política de privacidad
- **WHEN** el visitante lee `/privacidad/`
- **THEN** encuentra el correo `hola@cublasercreative.es` como canal de contacto junto a WhatsApp, y los proveedores que tratan los mensajes de correo

#### Scenario: Retirar el permiso de Instagram
- **WHEN** un visitante que aceptó las publicaciones de Instagram abre `/privacidad/` y pulsa el control para retirar el permiso
- **THEN** la página indica que el permiso ya no está concedido, y las fichas vuelven a mostrar el aviso en lugar de cargar Instagram

### Requirement: Rendimiento y privacidad
Las páginas públicas MUST NOT incluir JavaScript en el cliente, salvo el estrictamente necesario para:
- Activar videos, en páginas que tengan videos.
- Pedir el permiso y mostrar las publicaciones de Instagram, en páginas que las tengan.
- Retirar ese permiso, en la política de privacidad.

Al cargar una página, el sitio MUST NOT solicitar recursos a dominios de terceros, salvo las imágenes de previsualización de YouTube en páginas con videos y, solo si el visitante ya ha aceptado, el contenido de Instagram en páginas con publicaciones. Las tipografías e iconos SHALL servirse desde el propio sitio. El sitio MUST NOT crear cookies propias y MUST NOT permitir cookies de terceros mientras el visitante no active un video o acepte las publicaciones de Instagram. Las páginas de inicio, galería y ficha de trabajo SHALL obtener al menos 90 en rendimiento, accesibilidad, buenas prácticas y SEO en una auditoría Lighthouse para móvil, hecha sin permisos concedidos. El panel de edición (`/admin/`) no es una página pública y queda fuera de este requisito.

#### Scenario: Página sin videos
- **WHEN** se carga la galería `/trabajos/`
- **THEN** la página no descarga ningún archivo JavaScript, no hace peticiones a dominios externos y no crea cookies

#### Scenario: Ficha con Instagram sin permiso
- **WHEN** un visitante sin permiso concedido carga la ficha de un trabajo con publicaciones de Instagram
- **THEN** la página no hace peticiones a dominios de Instagram o Meta y no hay cookies

#### Scenario: Auditoría de rendimiento
- **WHEN** se audita con Lighthouse (móvil) la ficha de un trabajo con video
- **THEN** las cuatro puntuaciones son iguales o superiores a 90

### Requirement: Sitio completamente estático
La generación del sitio SHALL producir las páginas públicas únicamente como archivos estáticos (HTML, CSS, imágenes, tipografías y, en su caso, el JavaScript de los videos, de Instagram y del control de consentimiento), que puedan servirse desde un hosting estático sin servidor de aplicación ni base de datos. El único proceso de servidor admitido es el servicio de guardado del panel de edición. Las páginas públicas MUST NOT depender de él: si ese servicio falla o se retira, la web pública SHALL seguir funcionando igual.

#### Scenario: Despliegue en hosting estático
- **WHEN** se suben los archivos generados a un hosting estático
- **THEN** todas las páginas, rutas de categorías, fichas, páginas legales y la 404 funcionan sin ningún proceso de servidor

#### Scenario: Servicio del panel caído
- **WHEN** el servicio de guardado del panel da error o se desactiva
- **THEN** la portada, la galería, las fichas y las páginas legales se siguen sirviendo con normalidad
