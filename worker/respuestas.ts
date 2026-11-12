/** Error con el estado HTTP y el mensaje (en español, para quien edita) que devuelve la API. */
export class ErrorPanel extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

export function json(datos: unknown, estado = 200): Response {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export const respuestaDeError = (error: ErrorPanel) => json({ error: error.message }, error.estado);
