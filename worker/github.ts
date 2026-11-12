import { ErrorPanel } from './respuestas';

/**
 * Llamadas a la API de GitHub con el token del Worker. El token nunca sale de aquí: los
 * errores se traducen a mensajes propios sin copiar cabeceras ni cuerpos de GitHub.
 */

export const RE_SHA = /^[0-9a-f]{40}$/;

export async function github(env: Env, ruta: string, init: RequestInit = {}): Promise<Response> {
  if (!env.GITHUB_TOKEN) {
    throw new ErrorPanel(500, 'Falta el token de GitHub en el Worker: avisa a quien mantiene la web.');
  }
  return fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/${ruta}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'cub-laser-creative-panel',
      ...init.headers,
    },
  });
}

/** Lanza el error que verá quien edita si la respuesta de GitHub no es la esperada. */
export function comprobar(respuesta: Response): Response {
  if (respuesta.ok) return respuesta;
  if (respuesta.status === 401) {
    throw new ErrorPanel(
      502,
      'El acceso a GitHub ha caducado o no es válido: avisa a quien mantiene la web para que renueve el token.',
    );
  }
  if (respuesta.status === 403 || respuesta.status === 429) {
    throw new ErrorPanel(503, 'GitHub no deja guardar ahora mismo. Espera unos minutos y vuelve a intentarlo.');
  }
  throw new ErrorPanel(502, `GitHub ha respondido con un error (${respuesta.status}). Vuelve a intentarlo.`);
}

export async function githubJson<T>(env: Env, ruta: string, init?: RequestInit): Promise<T> {
  return (await comprobar(await github(env, ruta, init)).json()) as T;
}

export const enviar = (metodo: string, cuerpo: unknown): RequestInit => ({
  method: metodo,
  body: JSON.stringify(cuerpo),
  headers: { 'Content-Type': 'application/json' },
});
