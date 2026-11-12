/**
 * Worker de cublasercreative.es. Solo atiende la API del panel de edición (`/admin/api/*`,
 * ver `run_worker_first` en wrangler.jsonc); el resto del sitio lo sirven los recursos
 * estáticos sin pasar por aquí. Si este código falla, la web pública no se ve afectada.
 */
import { comprobarOrigen, correoDeLaSesion } from './acceso';
import { blob, contenido, eliminar, guardar, incluye, subirFoto } from './api';
import { ErrorPanel, json, respuestaDeError } from './respuestas';

const PREFIJO = '/admin/api/';

async function leerJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ErrorPanel(400, 'La petición no es un JSON válido.');
  }
}

async function api(request: Request, env: Env, ruta: string, url: URL): Promise<Response> {
  const correo = await correoDeLaSesion(request, env);
  if (!correo) {
    throw new ErrorPanel(403, 'Necesitas entrar en el panel con tu correo para hacer esto.');
  }

  if (request.method === 'GET') {
    if (ruta === 'sesion') return json({ correo });
    if (ruta === 'contenido') return contenido(env);
    if (ruta.startsWith('blob/')) return blob(env, ruta.slice('blob/'.length), url.searchParams.get('nombre'));
    if (ruta === 'incluye') return incluye(env, url.searchParams.get('commit'), url.searchParams.get('publicado'));
  } else if (request.method === 'POST') {
    comprobarOrigen(request);
    if (ruta === 'fotos') return subirFoto(env, request);
    if (ruta === 'guardar') return guardar(env, await leerJson(request));
    if (ruta === 'eliminar') return eliminar(env, await leerJson(request));
  }
  throw new ErrorPanel(404, 'Esta ruta del panel no existe.');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith(PREFIJO)) return env.ASSETS.fetch(request);

    try {
      return await api(request, env, url.pathname.slice(PREFIJO.length), url);
    } catch (error) {
      if (error instanceof ErrorPanel) return respuestaDeError(error);
      console.error(error);
      return respuestaDeError(new ErrorPanel(500, 'Error inesperado del panel. Vuelve a intentarlo.'));
    }
  },
} satisfies ExportedHandler<Env>;
