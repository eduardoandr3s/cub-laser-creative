/** Llamadas del panel a su API (`worker/`). Los errores llegan con un mensaje para quien edita. */

const BASE = '/admin/api';
// Si la sesión de Access caduca, el navegador ve la redirección a su página de acceso como un fallo de red.
const SIN_CONEXION =
  'No se ha podido conectar. Comprueba internet y, si llevas tiempo sin usar el panel, recarga la página para volver a entrar.';

export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

async function comprobar(respuesta: Response): Promise<Response> {
  if (respuesta.ok) return respuesta;
  // Access redirige o responde con su página de acceso cuando la sesión ha caducado.
  if (respuesta.redirected || respuesta.status === 401 || respuesta.status === 403) {
    const datos = (await respuesta.json().catch(() => null)) as { error?: string } | null;
    throw new ErrorApi(
      403,
      datos?.error ?? 'Tu sesión ha caducado. Recarga la página para volver a entrar con tu correo.',
    );
  }
  const datos = (await respuesta.json().catch(() => null)) as { error?: string } | null;
  throw new ErrorApi(respuesta.status, datos?.error ?? `Error del panel (${respuesta.status}). Vuelve a intentarlo.`);
}

async function pedir<T>(ruta: string, init?: RequestInit): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}/${ruta}`, { credentials: 'same-origin', ...init });
  } catch {
    throw new ErrorApi(0, SIN_CONEXION);
  }
  return (await comprobar(respuesta)).json() as Promise<T>;
}

const enviar = (cuerpo: unknown): RequestInit => ({
  method: 'POST',
  body: JSON.stringify(cuerpo),
  headers: { 'Content-Type': 'application/json', 'X-Panel': '1' },
});

export interface Contenido {
  /** slug → (nombre de archivo → sha). */
  trabajos: Record<string, Record<string, string>>;
  /** slug → sha del `.yml`. */
  categorias: Record<string, string>;
}

export const sesion = () => pedir<{ correo: string }>('sesion');
export const contenido = () => pedir<Contenido>('contenido');

/** URL de un archivo del repositorio (también sirve como `src` de una imagen). */
export const urlArchivo = (sha: string, nombre: string) =>
  `${BASE}/blob/${sha}?nombre=${encodeURIComponent(nombre)}`;

export async function leerTexto(sha: string, nombre: string): Promise<string> {
  const respuesta = await fetch(urlArchivo(sha, nombre), { credentials: 'same-origin' }).catch(() => {
    throw new ErrorApi(0, SIN_CONEXION);
  });
  return (await comprobar(respuesta)).text();
}

/** Sube una foto ya reducida (base64) e informa del progreso de 0 a 1. Devuelve el `sha` del blob. */
export function subirFoto(base64: string, progreso: (fraccion: number) => void): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const peticion = new XMLHttpRequest();
    peticion.open('POST', `${BASE}/fotos`);
    peticion.setRequestHeader('Content-Type', 'text/plain');
    peticion.setRequestHeader('X-Panel', '1');
    peticion.upload.addEventListener('progress', (evento) => {
      if (evento.lengthComputable) progreso(evento.loaded / evento.total);
    });
    peticion.addEventListener('load', () => {
      let datos: { sha?: string; error?: string } = {};
      try {
        datos = JSON.parse(peticion.responseText);
      } catch {
        // Sin JSON: se usa el mensaje genérico.
      }
      if (peticion.status === 201 && datos.sha) resolver(datos.sha);
      else rechazar(new ErrorApi(peticion.status, datos.error ?? 'No se ha podido subir la foto. Vuelve a intentarlo.'));
    });
    peticion.addEventListener('error', () =>
      rechazar(new ErrorApi(0, SIN_CONEXION)),
    );
    peticion.send(base64);
  });
}

export interface PeticionGuardar {
  slug: string;
  nuevo: boolean;
  indexSha: string | null;
  titulo: string;
  markdown: string;
  fotos: Record<string, string>;
  borrar: string[];
}

export const guardar = (peticion: PeticionGuardar) => pedir<{ commit: string }>('guardar', enviar(peticion));
export const eliminar = (peticion: { slug: string; indexSha: string; titulo: string }) =>
  pedir<{ commit: string }>('eliminar', enviar(peticion));
export const incluye = (commit: string, publicado: string) =>
  pedir<{ incluye: boolean }>(`incluye?commit=${commit}&publicado=${publicado}`);

/** Commit de la versión publicada de la web (`/version.json`), o `null` si no se sabe. */
export async function versionPublicada(): Promise<string | null> {
  try {
    const respuesta = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    const { commit } = (await respuesta.json()) as { commit: string | null };
    return commit;
  } catch {
    return null;
  }
}

/** `sha` que Git da a un archivo (blob) con este contenido, para seguir editando tras guardar. */
export async function shaDeGit(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  const cabecera = new TextEncoder().encode(`blob ${bytes.length}\0`);
  const todo = new Uint8Array(cabecera.length + bytes.length);
  todo.set(cabecera);
  todo.set(bytes, cabecera.length);
  const resumen = await crypto.subtle.digest('SHA-1', todo);
  return [...new Uint8Array(resumen)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
