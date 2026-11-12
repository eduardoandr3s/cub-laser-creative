import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from './index';

const TOKEN = 'github_pat_SECRETO_que_no_debe_salir';
const SHA_INDEX = '1'.repeat(40);
const SHA_PORTADA = '2'.repeat(40);
const SHA_FOTO_NUEVA = '3'.repeat(40);
const HEAD = 'c'.repeat(40);
const ORIGEN = 'http://localhost:8787';

interface Llamada {
  metodo: string;
  ruta: string;
  cuerpo: unknown;
}

/** GitHub simulado: una rama `main` con la carpeta de un trabajo. */
function simularGitHub({
  carpeta = { 'index.md': SHA_INDEX, 'portada.jpg': SHA_PORTADA, 'detalle-1.jpg': '4'.repeat(40) } as Record<
    string,
    string
  > | null,
  rechazosDeRef = 0,
  estado = 0,
} = {}) {
  const llamadas: Llamada[] = [];
  const fetchFalso = vi.fn(async (entrada: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(entrada));
    const ruta = url.pathname.replace('/repos/yo/repo/', '') + url.search;
    const metodo = init.method ?? 'GET';
    const texto = typeof init.body === 'string' ? init.body : undefined;
    llamadas.push({ metodo, ruta, cuerpo: texto ? JSON.parse(texto) : undefined });

    if (estado) return Response.json({ message: 'Bad credentials' }, { status: estado });
    if (ruta === 'git/ref/heads/main') return Response.json({ object: { sha: HEAD } });
    if (ruta === `git/commits/${HEAD}`) return Response.json({ tree: { sha: 'e'.repeat(40) } });
    if (ruta.startsWith('contents/src/content/trabajos/')) {
      return carpeta
        ? Response.json(Object.entries(carpeta).map(([name, sha]) => ({ name, sha, type: 'file' })))
        : Response.json({ message: 'Not Found' }, { status: 404 });
    }
    if (ruta === 'git/trees' && metodo === 'POST') return Response.json({ sha: 'a'.repeat(40) }, { status: 201 });
    if (ruta === 'git/commits' && metodo === 'POST') return Response.json({ sha: 'b'.repeat(40) }, { status: 201 });
    if (ruta === 'git/refs/heads/main' && metodo === 'PATCH') {
      return rechazosDeRef-- > 0 ? Response.json({}, { status: 422 }) : Response.json({ object: { sha: 'b'.repeat(40) } });
    }
    if (ruta === 'git/blobs' && metodo === 'POST') return Response.json({ sha: SHA_FOTO_NUEVA }, { status: 201 });
    if (ruta.startsWith('git/blobs/')) return new Response('contenido', { status: 200 });
    if (ruta === 'git/trees/main?recursive=1') {
      return Response.json({
        truncated: false,
        tree: [
          { path: 'src/content/trabajos/caja', type: 'tree', sha: 'f'.repeat(40) },
          { path: 'src/content/trabajos/caja/index.md', type: 'blob', sha: SHA_INDEX },
          { path: 'src/content/trabajos/caja/portada.jpg', type: 'blob', sha: SHA_PORTADA },
          { path: 'src/content/categorias/empresas.yml', type: 'blob', sha: '5'.repeat(40) },
          { path: 'src/config/negocio.ts', type: 'blob', sha: '6'.repeat(40) },
        ],
      });
    }
    if (ruta.startsWith('compare/')) return Response.json({ status: ruta.includes('d'.repeat(40)) ? 'behind' : 'ahead' });
    return Response.json({ message: `ruta no simulada: ${metodo} ${ruta}` }, { status: 500 });
  });
  vi.stubGlobal('fetch', fetchFalso);
  return { llamadas };
}

afterEach(() => vi.unstubAllGlobals());

const assets = { fetch: vi.fn(async () => new Response('página estática')) };
const env = (cambios: Partial<Env> = {}) =>
  ({
    ASSETS: assets,
    ACCESS_EQUIPO: '',
    ACCESS_AUD: '',
    GITHUB_REPO: 'yo/repo',
    GITHUB_RAMA: 'main',
    GITHUB_TOKEN: TOKEN,
    ACCESO_LOCAL: '1',
    ...cambios,
  }) as unknown as Env;

function pedir(ruta: string, { cuerpo, cabeceras, entorno }: { cuerpo?: unknown; cabeceras?: Record<string, string>; entorno?: Env } = {}) {
  const init: RequestInit = cuerpo === undefined
    ? {}
    : {
        method: 'POST',
        body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
        headers: { 'X-Panel': '1', Origin: ORIGEN, ...cabeceras },
      };
  return worker.fetch(new Request(`${ORIGEN}${ruta}`, init), entorno ?? env());
}

const guardarValido = {
  slug: 'caja',
  nuevo: false,
  indexSha: SHA_INDEX,
  titulo: 'Caja\ngrabada',
  markdown: '---\ntitulo: Caja grabada\n---\n\nTexto.\n',
  fotos: { 'foto-1.jpg': SHA_FOTO_NUEVA },
  borrar: ['detalle-1.jpg', 'no-existe.jpg'],
};

async function sinToken(respuesta: Response) {
  const texto = await respuesta.clone().text();
  expect(texto).not.toContain(TOKEN);
  for (const [, valor] of respuesta.headers) expect(valor).not.toContain(TOKEN);
  return texto;
}

describe('enrutado y acceso', () => {
  it('deja las rutas que no son de la API a los recursos estáticos', async () => {
    const respuesta = await pedir('/trabajos/');
    expect(await respuesta.text()).toBe('página estática');
  });

  it('rechaza sin sesión y sin llamar a GitHub', async () => {
    const { llamadas } = simularGitHub();
    const respuesta = await pedir('/admin/api/guardar', { cuerpo: guardarValido, entorno: env({ ACCESO_LOCAL: '' }) });
    expect(respuesta.status).toBe(403);
    expect(llamadas).toEqual([]);
  });

  it('rechaza un POST sin la cabecera del panel', async () => {
    const { llamadas } = simularGitHub();
    const respuesta = await pedir('/admin/api/guardar', { cuerpo: guardarValido, cabeceras: { 'X-Panel': '' } });
    expect(respuesta.status).toBe(403);
    expect(llamadas).toEqual([]);
  });

  it('devuelve el correo de la sesión', async () => {
    expect(await (await pedir('/admin/api/sesion')).json()).toEqual({ correo: 'local@localhost' });
  });
});

describe('POST /admin/api/guardar', () => {
  it('hace un único commit con el contenido, la foto nueva y las fotos que se quitan', async () => {
    const { llamadas } = simularGitHub();
    const respuesta = await pedir('/admin/api/guardar', { cuerpo: guardarValido });
    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ commit: 'b'.repeat(40) });

    const arbol = llamadas.find((l) => l.ruta === 'git/trees')?.cuerpo as { base_tree: string; tree: unknown[] };
    expect(arbol.base_tree).toBe('e'.repeat(40));
    expect(arbol.tree).toEqual([
      { path: 'src/content/trabajos/caja/index.md', mode: '100644', type: 'blob', content: guardarValido.markdown },
      { path: 'src/content/trabajos/caja/foto-1.jpg', mode: '100644', type: 'blob', sha: SHA_FOTO_NUEVA },
      { path: 'src/content/trabajos/caja/detalle-1.jpg', mode: '100644', type: 'blob', sha: null },
    ]);
    const commit = llamadas.find((l) => l.ruta === 'git/commits' && l.metodo === 'POST')?.cuerpo;
    expect(commit).toEqual({ message: 'Panel: guardar «Caja grabada»', tree: 'a'.repeat(40), parents: [HEAD] });
    expect(llamadas.filter((l) => l.metodo === 'PATCH')).toHaveLength(1);
    expect(llamadas.find((l) => l.metodo === 'PATCH')?.cuerpo).toEqual({ sha: 'b'.repeat(40), force: false });
  });

  it.each([
    ['un slug con ../', { slug: '../../src/config' }],
    ['un nombre de foto que no es una foto', { fotos: { 'negocio.ts': SHA_FOTO_NUEVA } }],
    ['una ruta en las fotos a borrar', { borrar: ['../otro-trabajo/index.md'] }],
    ['borrar el index.md', { borrar: ['index.md'] }],
    ['un markdown sin datos', { markdown: 'texto' }],
    ['un sha que no es un sha', { indexSha: 'abc' }],
  ])('rechaza %s sin llamar a GitHub', async (_caso, cambio) => {
    const { llamadas } = simularGitHub();
    const respuesta = await pedir('/admin/api/guardar', { cuerpo: { ...guardarValido, ...cambio } });
    expect(respuesta.status).toBe(400);
    expect(llamadas).toEqual([]);
  });

  it('no sobrescribe si el trabajo ha cambiado desde que se abrió', async () => {
    const { llamadas } = simularGitHub();
    const respuesta = await pedir('/admin/api/guardar', { cuerpo: { ...guardarValido, indexSha: '9'.repeat(40) } });
    expect(respuesta.status).toBe(409);
    expect((await respuesta.json()) as object).toHaveProperty('error', expect.stringMatching(/ha cambiado/));
    expect(llamadas.some((l) => l.metodo !== 'GET')).toBe(false);
  });

  it('no crea un trabajo nuevo si la carpeta ya existe', async () => {
    simularGitHub();
    const respuesta = await pedir('/admin/api/guardar', { cuerpo: { ...guardarValido, nuevo: true, indexSha: null } });
    expect(respuesta.status).toBe(409);
  });

  it('crea un trabajo nuevo con el mensaje «crear»', async () => {
    const { llamadas } = simularGitHub({ carpeta: null });
    const respuesta = await pedir('/admin/api/guardar', {
      cuerpo: { ...guardarValido, nuevo: true, indexSha: null, borrar: [] },
    });
    expect(respuesta.status).toBe(200);
    expect(llamadas.find((l) => l.ruta === 'git/commits' && l.metodo === 'POST')?.cuerpo).toMatchObject({
      message: 'Panel: crear «Caja grabada»',
    });
  });

  it('reintenta una vez si la rama avanza durante el guardado', async () => {
    const { llamadas } = simularGitHub({ rechazosDeRef: 1 });
    expect((await pedir('/admin/api/guardar', { cuerpo: guardarValido })).status).toBe(200);
    expect(llamadas.filter((l) => l.metodo === 'PATCH')).toHaveLength(2);
  });

  it('da error si la rama sigue avanzando en el reintento', async () => {
    simularGitHub({ rechazosDeRef: 2 });
    expect((await pedir('/admin/api/guardar', { cuerpo: guardarValido })).status).toBe(502);
  });

  it('avisa de que el token ha caducado sin mostrarlo', async () => {
    simularGitHub({ estado: 401 });
    const respuesta = await pedir('/admin/api/guardar', { cuerpo: guardarValido });
    expect(respuesta.status).toBe(502);
    expect(await sinToken(respuesta)).toMatch(/caducado/);
  });
});

describe('POST /admin/api/eliminar', () => {
  it('borra el contenido y las fotos en un commit', async () => {
    const { llamadas } = simularGitHub({ carpeta: { 'index.md': SHA_INDEX, 'portada.jpg': SHA_PORTADA, 'notas.txt': '7'.repeat(40) } });
    const respuesta = await pedir('/admin/api/eliminar', { cuerpo: { slug: 'caja', indexSha: SHA_INDEX, titulo: 'Caja' } });
    expect(respuesta.status).toBe(200);
    const arbol = llamadas.find((l) => l.ruta === 'git/trees')?.cuerpo as { tree: { path: string; sha: null }[] };
    expect(arbol.tree.map((e) => e.path)).toEqual([
      'src/content/trabajos/caja/index.md',
      'src/content/trabajos/caja/portada.jpg',
    ]);
    expect(arbol.tree.every((e) => e.sha === null)).toBe(true);
  });

  it('no borra si el trabajo ha cambiado', async () => {
    simularGitHub();
    const respuesta = await pedir('/admin/api/eliminar', { cuerpo: { slug: 'caja', indexSha: '9'.repeat(40), titulo: 'Caja' } });
    expect(respuesta.status).toBe(409);
  });
});

describe('POST /admin/api/fotos', () => {
  it('crea el blob y devuelve su sha', async () => {
    const { llamadas } = simularGitHub();
    const respuesta = await pedir('/admin/api/fotos', { cuerpo: 'iVBORw0KGgo=', cabeceras: { 'Content-Type': 'text/plain' } });
    expect(respuesta.status).toBe(201);
    expect(await respuesta.json()).toEqual({ sha: SHA_FOTO_NUEVA });
    expect(llamadas[0]?.cuerpo).toEqual({ encoding: 'base64', content: 'iVBORw0KGgo=' });
  });

  it('rechaza lo que no es base64 sin llamar a GitHub', async () => {
    const { llamadas } = simularGitHub();
    const respuesta = await pedir('/admin/api/fotos', { cuerpo: '","content":"x', cabeceras: { 'Content-Type': 'text/plain' } });
    expect(respuesta.status).toBe(400);
    expect(llamadas).toEqual([]);
  });
});

describe('lecturas', () => {
  it('lista los trabajos y las categorías', async () => {
    simularGitHub();
    const respuesta = await pedir('/admin/api/contenido');
    expect(await sinToken(respuesta)).toBeTruthy();
    expect(await respuesta.json()).toEqual({
      trabajos: { caja: { 'index.md': SHA_INDEX, 'portada.jpg': SHA_PORTADA } },
      categorias: { empresas: '5'.repeat(40) },
      incompleto: false,
    });
  });

  it('devuelve un blob con su tipo y caché inmutable', async () => {
    simularGitHub();
    const respuesta = await pedir(`/admin/api/blob/${SHA_PORTADA}?nombre=portada.jpg`);
    expect(respuesta.headers.get('Content-Type')).toBe('image/jpeg');
    expect(respuesta.headers.get('Cache-Control')).toContain('immutable');
    expect(await respuesta.text()).toBe('contenido');
  });

  it('rechaza un blob que no es un sha', async () => {
    simularGitHub();
    expect((await pedir('/admin/api/blob/..%2F..%2Fsecretos')).status).toBe(400);
  });

  it('sabe si la versión publicada incluye un commit', async () => {
    simularGitHub();
    const consulta = (a: string, b: string) => pedir(`/admin/api/incluye?commit=${a}&publicado=${b}`).then((r) => r.json());
    expect(await consulta('b'.repeat(40), 'b'.repeat(40))).toEqual({ incluye: true });
    expect(await consulta('b'.repeat(40), 'c'.repeat(40))).toEqual({ incluye: true });
    expect(await consulta('b'.repeat(40), 'd'.repeat(40))).toEqual({ incluye: false });
  });
});
