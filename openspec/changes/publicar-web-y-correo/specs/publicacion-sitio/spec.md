# Spec Delta

## Purpose

Publica el sitio estático de CUB Laser Creative en su dominio propio, de forma segura, sin coste de alojamiento y con publicación automática a partir del repositorio, para que cada cambio de contenido llegue a la web sin pasos manuales.

## ADDED Requirements

### Requirement: Dominio propio con HTTPS
El sitio SHALL servirse en `https://cublasercreative.es` con un certificado TLS válido y renovado automáticamente. Toda petición por HTTP SHALL redirigirse a la misma ruta por HTTPS.

#### Scenario: Acceso por HTTP
- **WHEN** un visitante abre `http://cublasercreative.es/trabajos/`
- **THEN** es redirigido a `https://cublasercreative.es/trabajos/` y la página carga sin avisos de certificado

### Requirement: Redirección de www
Las peticiones a `www.cublasercreative.es` SHALL redirigirse de forma permanente (301) a `https://cublasercreative.es`, conservando la ruta y los parámetros de la URL. El sitio MUST NOT servir contenido duplicado en `www`.

#### Scenario: Enlace con www
- **WHEN** un visitante abre `https://www.cublasercreative.es/trabajos/?ref=whatsapp`
- **THEN** recibe una redirección 301 a `https://cublasercreative.es/trabajos/?ref=whatsapp`

### Requirement: URLs con barra final
Cada página SHALL servirse en su URL terminada en `/`, que coincide con la URL canónica declarada en la página. Una petición a la misma ruta sin la barra final SHALL redirigirse a la versión con barra.

#### Scenario: Ruta sin barra final
- **WHEN** un visitante abre `https://cublasercreative.es/trabajos`
- **THEN** es redirigido a `https://cublasercreative.es/trabajos/`, que responde con estado 200

### Requirement: Respuesta a rutas inexistentes
Las peticiones a rutas que no existen SHALL responder con el código de estado HTTP 404 y el contenido de la página 404 del sitio, para que los buscadores no las indexen como páginas válidas.

#### Scenario: Ruta inexistente
- **WHEN** se solicita `https://cublasercreative.es/trabajos/no-existe/`
- **THEN** la respuesta tiene estado 404 y muestra la página 404 del sitio

### Requirement: Publicación automática desde el repositorio
Cada cambio que llegue a la rama `main` del repositorio del sitio SHALL generar y publicar la nueva versión sin pasos manuales. Si la generación del sitio falla, la versión publicada MUST NOT cambiar.

#### Scenario: Publicar un trabajo nuevo
- **WHEN** se añade un trabajo válido y el cambio llega a `main`
- **THEN** en pocos minutos su ficha está disponible en `https://cublasercreative.es/trabajos/<slug>/`

#### Scenario: Cambio con contenido inválido
- **WHEN** llega a `main` un trabajo con una categoría inexistente
- **THEN** la generación falla, el panel de despliegues muestra el error y el sitio sigue mostrando la versión anterior

### Requirement: Vista previa de otras ramas
Los cambios en ramas distintas de `main` SHALL publicarse en una URL de vista previa propia, distinta del dominio de producción, sin afectar al sitio publicado.

#### Scenario: Revisar un cambio antes de publicarlo
- **WHEN** se sube una rama `nuevos-trabajos` con cambios
- **THEN** existe una URL de vista previa con esos cambios y `https://cublasercreative.es` no cambia

### Requirement: Vuelta a una versión anterior
El titular SHALL poder restaurar cualquiera de las versiones publicadas anteriormente desde el panel del alojamiento, sin volver a generar el sitio.

#### Scenario: Deshacer una publicación
- **WHEN** el titular elige una versión anterior en el panel de despliegues y la restaura
- **THEN** `https://cublasercreative.es` vuelve a servir esa versión

### Requirement: Caché de los recursos estáticos
Los recursos cuyo nombre incluye una huella de su contenido (hojas de estilo, tipografías, imágenes optimizadas y scripts generados) SHALL servirse con una caché de al menos un año marcada como inmutable. Las páginas HTML SHALL revalidarse en cada visita, para que una nueva publicación sea visible al recargar.

#### Scenario: Recurso con huella
- **WHEN** se solicita un archivo de `/_astro/`
- **THEN** la respuesta incluye `Cache-Control` con `max-age` de al menos 31536000 segundos e `immutable`

#### Scenario: Nueva publicación
- **WHEN** un visitante que ya conocía la portada la recarga después de una nueva publicación
- **THEN** ve el contenido nuevo sin tener que borrar la caché del navegador

### Requirement: Sin coste de alojamiento
El alojamiento, la publicación automática, el DNS, los certificados y las redirecciones SHALL funcionar con planes gratuitos que permitan uso comercial, sin límite de tráfico para el contenido estático. El único coste del sitio SHALL ser la renovación del dominio.

#### Scenario: Revisión de la facturación
- **WHEN** el titular revisa su cuenta del proveedor de alojamiento tras un mes publicado
- **THEN** todos los servicios usados figuran en el plan gratuito y no hay cargos
