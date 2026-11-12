import { ARCHIVO_TRABAJO, CARPETA_CATEGORIAS, CARPETA_TRABAJOS, esNombreFoto, esSlugValido, rutaArchivo } from '../src/lib/panel/rutas';
import { comprobar, enviar, github, githubJson, RE_SHA } from './github';
import { ErrorPanel, json } from './respuestas';

/** Fotos ya reducidas en el navegador y en base64. 8 MB sobran para una foto de 2400 px. */
const MAX_FOTO = 8 * 1024 * 1024;
const MAX_MARKDOWN = 100 * 1024;
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;

const TIPOS: Record<string, string> = {
  md: 'text/markdown; charset=utf-8',
  yml: 'text/yaml; charset=utf-8',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

interface EntradaArbol {
  path: string;
  type: string;
  sha: string;
}

/** Archivos de los trabajos y de las categorías en la rama, con el `sha` de cada uno. */
export async function contenido(env: Env): Promise<Response> {
  const arbol = await githubJson<{ tree: EntradaArbol[]; truncated: boolean }>(
    env,
    `git/trees/${encodeURIComponent(env.GITHUB_RAMA)}?recursive=1`,
  );
  const trabajos: Record<string, Record<string, string>> = {};
  const categorias: Record<string, string> = {};

  for (const { path, type, sha } of arbol.tree) {
    if (type !== 'blob') continue;
    const [slug, archivo, ...resto] = path.startsWith(`${CARPETA_TRABAJOS}/`)
      ? path.slice(CARPETA_TRABAJOS.length + 1).split('/')
      : [];
    if (slug && archivo && resto.length === 0) {
      (trabajos[slug] ??= {})[archivo] = sha;
    } else if (path.startsWith(`${CARPETA_CATEGORIAS}/`) && path.endsWith('.yml')) {
      categorias[path.slice(CARPETA_CATEGORIAS.length + 1, -'.yml'.length)] = sha;
    }
  }

  return json({ trabajos, categorias, incompleto: arbol.truncated });
}

/** Contenido de un archivo por su `sha`. Como el `sha` identifica el contenido, se cachea para siempre. */
export async function blob(env: Env, sha: string, nombre: string | null): Promise<Response> {
  if (!RE_SHA.test(sha)) throw new ErrorPanel(400, 'Identificador de archivo no válido.');
  const respuesta = comprobar(
    await github(env, `git/blobs/${sha}`, { headers: { Accept: 'application/vnd.github.raw+json' } }),
  );
  const extension = nombre?.split('.').pop()?.toLowerCase() ?? '';
  return new Response(respuesta.body, {
    headers: {
      'Content-Type': TIPOS[extension] ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/** Sube una foto (base64) como blob de GitHub y devuelve su `sha`, que luego usa `guardar`. */
export async function subirFoto(env: Env, request: Request): Promise<Response> {
  const demasiadoGrande = new ErrorPanel(413, 'La foto es demasiado grande (máximo 8 MB).');
  if (Number(request.headers.get('Content-Length')) > MAX_FOTO) throw demasiadoGrande;
  const base64 = (await request.text()).trim();
  if (base64.length > MAX_FOTO) throw demasiadoGrande;
  if (!base64 || !BASE64.test(base64)) {
    throw new ErrorPanel(400, 'La foto no ha llegado bien. Vuelve a subirla.');
  }
  // El base64 ya está validado: no necesita escaparse dentro del JSON.
  const { sha } = await githubJson<{ sha: string }>(env, 'git/blobs', {
    method: 'POST',
    body: `{"encoding":"base64","content":"${base64}"}`,
    headers: { 'Content-Type': 'application/json' },
  });
  return json({ sha }, 201);
}

interface PeticionGuardar {
  slug: string;
  nuevo: boolean;
  /** `sha` del `index.md` que se abrió; `null` en un trabajo nuevo. */
  indexSha: string | null;
  titulo: string;
  markdown: string;
  /** Fotos nuevas o cambiadas: nombre → `sha` del blob subido. */
  fotos: Record<string, string>;
  /** Fotos que el trabajo ha dejado de usar. */
  borrar: string[];
}

interface PeticionEliminar {
  slug: string;
  indexSha: string;
  titulo: string;
}

type EntradaNueva = { path: string; mode: '100644'; type: 'blob' } & ({ sha: string | null } | { content: string });

function leerPeticionGuardar(datos: unknown): PeticionGuardar {
  const p = (datos ?? {}) as Partial<PeticionGuardar>;
  const fotos = p.fotos && typeof p.fotos === 'object' ? p.fotos : {};
  const borrar = Array.isArray(p.borrar) ? p.borrar : [];
  const valido =
    typeof p.slug === 'string' &&
    esSlugValido(p.slug) &&
    typeof p.nuevo === 'boolean' &&
    (p.nuevo ? p.indexSha === null : typeof p.indexSha === 'string' && RE_SHA.test(p.indexSha)) &&
    typeof p.titulo === 'string' &&
    typeof p.markdown === 'string' &&
    p.markdown.startsWith('---') &&
    p.markdown.length <= MAX_MARKDOWN &&
    Object.entries(fotos).every(([nombre, sha]) => esNombreFoto(nombre) && typeof sha === 'string' && RE_SHA.test(sha)) &&
    borrar.every((nombre) => typeof nombre === 'string' && esNombreFoto(nombre));
  if (!valido) throw new ErrorPanel(400, 'Petición de guardado no válida.');
  return { ...(p as PeticionGuardar), fotos, borrar };
}

function leerPeticionEliminar(datos: unknown): PeticionEliminar {
  const p = (datos ?? {}) as Partial<PeticionEliminar>;
  const valido =
    typeof p.slug === 'string' &&
    esSlugValido(p.slug) &&
    typeof p.indexSha === 'string' &&
    RE_SHA.test(p.indexSha) &&
    typeof p.titulo === 'string';
  if (!valido) throw new ErrorPanel(400, 'Petición de eliminación no válida.');
  return p as PeticionEliminar;
}

/** Título para el mensaje del commit: una línea, sin caracteres de control, máximo 100 caracteres. */
const tituloCommit = (titulo: string) =>
  titulo.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, 100) || 'sin título';

/**
 * Hace un único commit sobre la rama con los cambios que calcule `cambios` a partir de los
 * archivos actuales de la carpeta (`null` si no existe). Si la rama avanza mientras tanto,
 * lo reintenta una vez desde la nueva punta.
 */
async function commitEnCarpeta(
  env: Env,
  slug: string,
  mensaje: string,
  cambios: (actuales: Map<string, string> | null) => EntradaNueva[],
): Promise<string> {
  const rama = encodeURIComponent(env.GITHUB_RAMA);
  for (let intento = 1; ; intento++) {
    const ref = await githubJson<{ object: { sha: string } }>(env, `git/ref/heads/${rama}`);
    const padre = ref.object.sha;
    const commit = await githubJson<{ tree: { sha: string } }>(env, `git/commits/${padre}`);

    const listado = await github(env, `contents/${CARPETA_TRABAJOS}/${slug}?ref=${padre}`);
    let actuales: Map<string, string> | null = null;
    if (listado.status !== 404) {
      const archivos = (await comprobar(listado).json()) as { name: string; sha: string; type: string }[];
      actuales = new Map(archivos.filter((a) => a.type === 'file').map((a) => [a.name, a.sha]));
    }

    const arbol = await githubJson<{ sha: string }>(
      env,
      'git/trees',
      enviar('POST', { base_tree: commit.tree.sha, tree: cambios(actuales) }),
    );
    const nuevo = await githubJson<{ sha: string }>(
      env,
      'git/commits',
      enviar('POST', { message: mensaje, tree: arbol.sha, parents: [padre] }),
    );

    const avance = await github(env, `git/refs/heads/${rama}`, enviar('PATCH', { sha: nuevo.sha, force: false }));
    // 422: la rama ha avanzado (otro commit en medio). Se repite una vez con la nueva punta.
    if (avance.status === 422 && intento === 1) continue;
    comprobar(avance);
    return nuevo.sha;
  }
}

export async function guardar(env: Env, datos: unknown): Promise<Response> {
  const p = leerPeticionGuardar(datos);
  const accion = p.nuevo ? 'crear' : 'guardar';

  const commit = await commitEnCarpeta(env, p.slug, `Panel: ${accion} «${tituloCommit(p.titulo)}»`, (actuales) => {
    if (p.nuevo && actuales) {
      throw new ErrorPanel(409, 'Ya hay un trabajo con este identificador. Elige otro.');
    }
    if (!p.nuevo && actuales?.get(ARCHIVO_TRABAJO) !== p.indexSha) {
      throw new ErrorPanel(
        409,
        'Este trabajo ha cambiado desde que lo abriste (quizá lo ha guardado otra persona). Copia lo que hayas escrito y vuelve a cargarlo.',
      );
    }
    const entradas: EntradaNueva[] = [
      { path: rutaArchivo(p.slug, ARCHIVO_TRABAJO), mode: '100644', type: 'blob', content: p.markdown },
    ];
    for (const [nombre, sha] of Object.entries(p.fotos)) {
      entradas.push({ path: rutaArchivo(p.slug, nombre), mode: '100644', type: 'blob', sha });
    }
    for (const nombre of p.borrar) {
      // Solo se borra lo que existe y no se acaba de subir con el mismo nombre.
      if (actuales?.has(nombre) && !(nombre in p.fotos)) {
        entradas.push({ path: rutaArchivo(p.slug, nombre), mode: '100644', type: 'blob', sha: null });
      }
    }
    return entradas;
  });

  return json({ commit });
}

export async function eliminar(env: Env, datos: unknown): Promise<Response> {
  const p = leerPeticionEliminar(datos);

  const commit = await commitEnCarpeta(env, p.slug, `Panel: eliminar «${tituloCommit(p.titulo)}»`, (actuales) => {
    if (!actuales) throw new ErrorPanel(404, 'Este trabajo ya no existe.');
    if (actuales.get(ARCHIVO_TRABAJO) !== p.indexSha) {
      throw new ErrorPanel(409, 'Este trabajo ha cambiado desde que lo abriste. Vuelve a cargarlo antes de eliminarlo.');
    }
    // Se borran el contenido y las fotos. Un archivo con otro nombre (añadido a mano) se queda:
    // el panel no escribe fuera de los nombres permitidos.
    return [...actuales.keys()]
      .filter((nombre) => nombre === ARCHIVO_TRABAJO || esNombreFoto(nombre))
      .map((nombre) => ({ path: rutaArchivo(p.slug, nombre), mode: '100644', type: 'blob', sha: null }) as const);
  });

  return json({ commit });
}

/** Si el commit `publicado` (el de la web) contiene el commit `commit` (el guardado). */
export async function incluye(env: Env, commit: string | null, publicado: string | null): Promise<Response> {
  if (!commit || !publicado || !RE_SHA.test(commit) || !RE_SHA.test(publicado)) {
    throw new ErrorPanel(400, 'Commits no válidos.');
  }
  if (commit === publicado) return json({ incluye: true });
  const respuesta = await github(env, `compare/${commit}...${publicado}`);
  if (respuesta.status === 404) return json({ incluye: false });
  const { status } = (await comprobar(respuesta).json()) as { status: string };
  return json({ incluye: status === 'ahead' || status === 'identical' });
}
