# Spec Delta

## Purpose

Convierte las visitas en conversaciones: ofrece en todo el sitio formas directas de escribir a CUB Laser Creative por WhatsApp, con mensajes prellenados según el contexto y sin necesidad de backend.

## ADDED Requirements

### Requirement: Número de WhatsApp único y validado
El número de WhatsApp del negocio SHALL declararse una sola vez en la configuración del negocio, en formato internacional: solo dígitos, con prefijo de país y sin `+`, espacios ni símbolos (entre 8 y 15 dígitos, sin empezar por 0). Todos los enlaces de WhatsApp del sitio SHALL construirse a partir de ese valor. La generación del sitio para producción MUST fallar si el número está vacío o no cumple el formato; en el entorno de desarrollo local SHALL mostrarse un aviso en la consola sin impedir el arranque.

#### Scenario: Cambio de número
- **WHEN** se cambia el número en la configuración del negocio y se regenera el sitio
- **THEN** todos los enlaces de WhatsApp del sitio usan el número nuevo

#### Scenario: Número con formato inválido
- **WHEN** el número configurado es `+34 600 00 00 00`
- **THEN** la generación del sitio falla con un mensaje que indica el formato esperado

### Requirement: Formato de los enlaces de WhatsApp
Los enlaces SHALL tener la forma `https://wa.me/<numero>?text=<mensaje>`, con el mensaje codificado para URL (incluidos acentos, `ñ`, espacios y saltos de línea). Los enlaces SHALL abrirse en una pestaña nueva o en la app de WhatsApp sin exponer la página de origen (`rel="noopener"`).

#### Scenario: Mensaje con caracteres especiales
- **WHEN** el mensaje es "Hola, ¿pueden grabar un diseño para el cumpleaños de mi niña?"
- **THEN** el enlace generado contiene ese texto correctamente codificado y WhatsApp lo muestra intacto

### Requirement: Botón flotante de WhatsApp
Todas las páginas del sitio, incluida la de error 404, SHALL mostrar un botón flotante de WhatsApp fijo en la esquina inferior derecha. El botón SHALL tener nombre accesible ("Escribir por WhatsApp"), un área táctil mínima de 44×44 px y foco visible, y MUST NOT tapar de forma permanente contenido o controles al final de la página. Fuera de las fichas de trabajo, el botón SHALL usar el mensaje genérico definido en la configuración del negocio.

#### Scenario: Botón en la galería
- **WHEN** el visitante está en `/trabajos/` y pulsa el botón flotante
- **THEN** se abre WhatsApp con el número del negocio y el mensaje genérico configurado

#### Scenario: Final de página
- **WHEN** el visitante se desplaza hasta el final de cualquier página
- **THEN** los enlaces del pie de página siguen siendo visibles y pulsables

### Requirement: Contacto contextual desde un trabajo
La ficha de cada trabajo SHALL incluir un botón destacado "Quiero algo así" que abra WhatsApp con un mensaje que incluya el título del trabajo y la URL absoluta de su ficha. En las fichas de trabajo, el botón flotante SHALL usar ese mismo mensaje contextual.

#### Scenario: Pedir un trabajo similar
- **WHEN** el visitante pulsa "Quiero algo así" en la ficha de "Caja grabada"
- **THEN** se abre WhatsApp con un mensaje que contiene "Caja grabada" y la URL completa de `/trabajos/caja-grabada/`
