/**
 * Qué archivos puede tocar el panel de edición. Las usan la interfaz (para proponer nombres)
 * y el Worker (para rechazar cualquier ruta fuera de la carpeta de un trabajo).
 */

export const CARPETA_TRABAJOS = 'src/content/trabajos';
export const CARPETA_CATEGORIAS = 'src/content/categorias';
export const ARCHIVO_TRABAJO = 'index.md';

/** Identificador de un trabajo (nombre de su carpeta y final de su URL). */
export const RE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Fotos que el panel puede escribir o borrar: minúsculas, sin espacios ni rutas. */
export const RE_FOTO = /^[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpe?g|png|webp)$/;

export const esSlugValido = (slug: string) => RE_SLUG.test(slug) && slug.length <= 80;
export const esNombreFoto = (nombre: string) => RE_FOTO.test(nombre) && nombre.length <= 100;
export const esArchivoDeTrabajo = (nombre: string) => nombre === ARCHIVO_TRABAJO || esNombreFoto(nombre);

/** Ruta en el repositorio de un archivo de un trabajo. Lanza un error si el slug o el nombre no son válidos. */
export function rutaArchivo(slug: string, archivo: string): string {
  if (!esSlugValido(slug)) throw new Error(`Identificador de trabajo no válido: "${slug}"`);
  if (!esArchivoDeTrabajo(archivo)) throw new Error(`Nombre de archivo no válido: "${archivo}"`);
  return `${CARPETA_TRABAJOS}/${slug}/${archivo}`;
}

/** Primer `foto-<n>.jpg` que no está entre los nombres dados. */
export function siguienteNombreFoto(existentes: Iterable<string>): string {
  const usados = new Set(existentes);
  let n = 1;
  while (usados.has(`foto-${n}.jpg`)) n++;
  return `foto-${n}.jpg`;
}
