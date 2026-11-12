import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ErrorPanel } from './respuestas';

/**
 * Quién hace la petición. Cloudflare Access protege `/admin/*` en el dominio, pero las vistas
 * previas (`*.workers.dev`) no pasan por Access, así que el Worker comprueba siempre el JWT que
 * Access añade en `Cf-Access-Jwt-Assertion` (firma, `iss` y `aud`).
 */

// Claves públicas del equipo, en caché mientras viva el Worker.
const conjuntos = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function clavesDelEquipo(equipo: string) {
  let conjunto = conjuntos.get(equipo);
  if (!conjunto) {
    conjunto = createRemoteJWKSet(new URL(`${equipo}/cdn-cgi/access/certs`));
    conjuntos.set(equipo, conjunto);
  }
  return conjunto;
}

const HOSTS_LOCALES = new Set(['localhost', '127.0.0.1']);

/** Devuelve el correo de la sesión o `null` si la petición no viene de una sesión válida. */
export async function correoDeLaSesion(request: Request, env: Env): Promise<string | null> {
  // Solo en desarrollo: `.dev.vars` activa ACCESO_LOCAL, que en un dominio real no tiene efecto.
  if (env.ACCESO_LOCAL === '1' && HOSTS_LOCALES.has(new URL(request.url).hostname)) {
    return 'local@localhost';
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  const equipo = env.ACCESS_EQUIPO?.replace(/\/+$/, '');
  if (!token || !equipo || !env.ACCESS_AUD) return null;

  try {
    const { payload } = await jwtVerify(token, clavesDelEquipo(equipo), {
      issuer: equipo,
      audience: env.ACCESS_AUD,
    });
    return typeof payload.email === 'string' ? payload.email : null;
  } catch {
    return null;
  }
}

/**
 * Las peticiones que escriben exigen la cabecera `X-Panel` y un `Origin` igual al del sitio.
 * Otra web no puede enviar esa cabecera sin CORS, y el Worker no responde a CORS.
 */
export function comprobarOrigen(request: Request): void {
  const origen = request.headers.get('Origin');
  if (request.headers.get('X-Panel') !== '1' || origen !== new URL(request.url).origin) {
    throw new ErrorPanel(403, 'Petición rechazada: no viene del panel.');
  }
}
