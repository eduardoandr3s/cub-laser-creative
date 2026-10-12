# Spec Delta

## Purpose

Da a CUB Laser Creative una dirección de correo con su dominio, `hola@cublasercreative.es`, que recibe en el buzón personal del titular y le permite responder con la dirección profesional, sin coste mensual y con una entrega fiable.

## ADDED Requirements

### Requirement: Recepción en el buzón del titular
Los mensajes enviados a `hola@cublasercreative.es` SHALL entregarse en el buzón personal de Gmail del titular, con el remitente original visible, de forma que responder desde ese buzón conteste a quien escribió.

#### Scenario: Mensaje de un cliente
- **WHEN** un cliente escribe a `hola@cublasercreative.es` desde su propia cuenta de correo
- **THEN** el mensaje llega al Gmail del titular en pocos minutos, con el cliente como remitente

### Requirement: Solo direcciones configuradas
Solo SHALL aceptarse las direcciones del dominio configuradas expresamente (inicialmente, `hola@`). Los mensajes dirigidos a cualquier otra dirección del dominio MUST NOT entregarse al titular, y el remitente SHALL recibir un aviso de que la dirección no existe.

#### Scenario: Dirección inexistente
- **WHEN** alguien escribe a `ventas@cublasercreative.es`
- **THEN** el mensaje no llega al Gmail del titular y el remitente recibe un aviso de entrega fallida

### Requirement: Respuestas con la dirección profesional
El titular SHALL poder escribir y responder desde su Gmail usando `hola@cublasercreative.es` como remitente, con el nombre "CUB Laser Creative". La dirección personal de Gmail del titular MUST NOT aparecer en el remitente ni en la dirección de respuesta de esos mensajes.

#### Scenario: Responder a un cliente
- **WHEN** el titular responde desde Gmail a un mensaje recibido en `hola@cublasercreative.es`
- **THEN** el cliente recibe la respuesta de "CUB Laser Creative <hola@cublasercreative.es>" y, si contesta, su mensaje vuelve a `hola@cublasercreative.es`

### Requirement: Dominio autenticado para el correo saliente
Los mensajes enviados como `hola@cublasercreative.es` SHALL superar la comprobación DMARC del dominio, con una firma DKIM alineada con `cublasercreative.es`. El dominio SHALL publicar un único registro SPF y una política DMARC.

#### Scenario: Comprobación en el destinatario
- **WHEN** el titular envía un mensaje como `hola@cublasercreative.es` a una cuenta de Gmail externa y se consulta su original
- **THEN** el mensaje muestra `DKIM: PASS` con el dominio `cublasercreative.es` y `DMARC: PASS`, y llega a la bandeja de entrada, no a spam

### Requirement: Sin coste mensual
La recepción y el envío del correo profesional SHALL funcionar con planes gratuitos, con capacidad para al menos 100 mensajes enviados al día, sin contratar buzones ni servicios de pago.

#### Scenario: Revisión de servicios
- **WHEN** el titular revisa las cuentas usadas para el correo
- **THEN** todas están en el plan gratuito y no hay cargos
