/** Enlace `wa.me` con el mensaje prellenado y codificado para URL. */
export function enlaceWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

/** Mensaje para pedir algo parecido a un trabajo concreto. */
export function mensajeTrabajo(titulo: string, url: string | URL): string {
  return `Hola, he visto el trabajo «${titulo}» en vuestra web y me gustaría algo así:\n${url}`;
}
