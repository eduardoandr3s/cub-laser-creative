import { parse } from 'yaml';
import { leerTrabajo, type Trabajo } from '../lib/panel/markdown';
import { ARCHIVO_TRABAJO } from '../lib/panel/rutas';
import * as api from './api';

/** Un trabajo tal como está en el repositorio. */
export interface TrabajoGuardado {
  slug: string;
  /** Archivos de su carpeta: nombre → sha. */
  archivos: Record<string, string>;
  indexSha: string;
  trabajo: Trabajo | null;
  /** Si su `index.md` no se ha podido leer. */
  error?: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  orden: number;
}

/** Ejecuta las tareas con un máximo de `limite` a la vez. */
async function enParalelo<T, R>(elementos: T[], limite: number, tarea: (elemento: T) => Promise<R>): Promise<R[]> {
  const resultados: R[] = new Array(elementos.length);
  let siguiente = 0;
  const trabajador = async () => {
    while (siguiente < elementos.length) {
      const i = siguiente++;
      resultados[i] = await tarea(elementos[i]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limite, elementos.length) }, trabajador));
  return resultados;
}

export async function cargarContenido(): Promise<{ trabajos: TrabajoGuardado[]; categorias: Categoria[] }> {
  const contenido = await api.contenido();

  const trabajos = await enParalelo(
    Object.entries(contenido.trabajos).filter(([, archivos]) => archivos[ARCHIVO_TRABAJO]),
    6,
    async ([slug, archivos]): Promise<TrabajoGuardado> => {
      const indexSha = archivos[ARCHIVO_TRABAJO]!;
      try {
        return { slug, archivos, indexSha, trabajo: leerTrabajo(await api.leerTexto(indexSha, ARCHIVO_TRABAJO)) };
      } catch (error) {
        if (error instanceof api.ErrorApi) throw error;
        return { slug, archivos, indexSha, trabajo: null, error: (error as Error).message };
      }
    },
  );

  const categorias = await enParalelo(Object.entries(contenido.categorias), 6, async ([id, sha]) => {
    const datos = (parse(await api.leerTexto(sha, `${id}.yml`)) ?? {}) as { nombre?: unknown; orden?: unknown };
    return {
      id,
      nombre: typeof datos.nombre === 'string' ? datos.nombre : id,
      orden: typeof datos.orden === 'number' ? datos.orden : 0,
    };
  });

  trabajos.sort(
    (a, b) =>
      (b.trabajo?.datos.fecha ?? '').localeCompare(a.trabajo?.datos.fecha ?? '') || a.slug.localeCompare(b.slug),
  );
  categorias.sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'));
  return { trabajos, categorias };
}
