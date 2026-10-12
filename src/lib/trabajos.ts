import { getCollection, type CollectionEntry } from 'astro:content';

export type Trabajo = CollectionEntry<'trabajos'>;
export type Categoria = CollectionEntry<'categorias'>;

/**
 * Trabajos visibles, del más reciente al más antiguo. Los borradores solo se
 * incluyen en desarrollo. Falla si algún trabajo usa una categoría inexistente.
 */
export async function getTrabajosPublicados(): Promise<Trabajo[]> {
  const [trabajos, categorias] = await Promise.all([
    getCollection('trabajos'),
    getCollection('categorias'),
  ]);

  const existentes = new Set(categorias.map((categoria) => categoria.id));
  for (const trabajo of trabajos) {
    const { id } = trabajo.data.categoria;
    if (!existentes.has(id)) {
      throw new Error(
        `[trabajos] ${trabajo.filePath} → campo "categoria": no existe la categoría "${id}". ` +
          `Crea src/content/categorias/${id}.yml o usa una de: ${[...existentes].join(', ')}.`,
      );
    }
  }

  return ordenarPorFecha(trabajos.filter((trabajo) => !(import.meta.env.PROD && trabajo.data.borrador)));
}

/** Categorías ordenadas por `orden` (y por nombre si empatan). */
export async function getCategorias(): Promise<Categoria[]> {
  const categorias = await getCollection('categorias');
  return categorias.sort(
    (a, b) => a.data.orden - b.data.orden || a.data.nombre.localeCompare(b.data.nombre, 'es'),
  );
}

/** Lo mínimo que necesitan las funciones de selección de un trabajo. */
export interface TrabajoSeleccionable {
  id: string;
  data: {
    fecha: Date;
    destacado?: boolean;
    categoria: { id: string };
  };
}

/** Copia ordenada por fecha descendente (a igual fecha, por id). */
export function ordenarPorFecha<T extends TrabajoSeleccionable>(trabajos: readonly T[]): T[] {
  return [...trabajos].sort(
    (a, b) => b.data.fecha.getTime() - a.data.fecha.getTime() || a.id.localeCompare(b.id),
  );
}

/**
 * Hasta `max` trabajos marcados como destacados, del más reciente al más antiguo.
 * Si no hay ninguno marcado, los `max` más recientes.
 */
export function seleccionarDestacados<T extends TrabajoSeleccionable>(
  trabajos: readonly T[],
  max = 6,
): T[] {
  const ordenados = ordenarPorFecha(trabajos);
  const marcados = ordenados.filter((trabajo) => trabajo.data.destacado);
  return (marcados.length > 0 ? marcados : ordenados).slice(0, max);
}

/** Hasta `max` trabajos de la misma categoría que `actual`, sin incluirlo. */
export function seleccionarRelacionados<T extends TrabajoSeleccionable>(
  trabajos: readonly T[],
  actual: TrabajoSeleccionable,
  max = 3,
): T[] {
  return ordenarPorFecha(trabajos)
    .filter(
      (trabajo) =>
        trabajo.id !== actual.id && trabajo.data.categoria.id === actual.data.categoria.id,
    )
    .slice(0, max);
}

/** Las categorías que tienen al menos uno de los trabajos dados, en el mismo orden. */
export function categoriasConTrabajos<C extends { id: string }>(
  categorias: readonly C[],
  trabajos: readonly TrabajoSeleccionable[],
): C[] {
  const usadas = new Set(trabajos.map((trabajo) => trabajo.data.categoria.id));
  return categorias.filter((categoria) => usadas.has(categoria.id));
}
