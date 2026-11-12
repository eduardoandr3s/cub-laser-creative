import { parse, stringify } from 'yaml';

/**
 * Lectura y escritura del `index.md` de un trabajo desde el panel. El archivo que se
 * escribe tiene el mismo formato que los escritos a mano, para que la generación del
 * sitio lo valide igual. Los comentarios YAML no se conservan.
 */

/** Foto de un trabajo: `src` es el nombre del archivo dentro de su carpeta, sin `./`. */
export interface Foto {
  src: string;
  alt: string;
}

export interface DatosTrabajo {
  titulo: string;
  descripcion: string;
  categoria: string;
  /** `AAAA-MM-DD`. */
  fecha: string;
  borrador: boolean;
  material: string;
  destacado: boolean;
  portada: Foto;
  imagenes: Foto[];
  /** Enlaces tal como se escribieron (se validan aparte). */
  videos: string[];
  instagram: string[];
}

export interface Trabajo {
  datos: DatosTrabajo;
  /** Descripción larga en Markdown. */
  cuerpo: string;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

const texto = (valor: unknown) => (typeof valor === 'string' ? valor.trim() : '');
const sinPuntoBarra = (ruta: string) => ruta.replace(/^\.\//, '');
const textos = (valor: unknown) => (Array.isArray(valor) ? valor.filter((v) => typeof v === 'string') : []);

function foto(valor: unknown): Foto {
  const datos = (valor ?? {}) as Record<string, unknown>;
  return { src: sinPuntoBarra(texto(datos.src)), alt: texto(datos.alt) };
}

function fecha(valor: unknown): string {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) return valor.toISOString().slice(0, 10);
  return typeof valor === 'string' ? valor.trim() : '';
}

/** Separa el frontmatter del cuerpo. Los campos que falten quedan vacíos o con su valor por defecto. */
export function leerTrabajo(contenido: string): Trabajo {
  const partes = FRONTMATTER.exec(contenido);
  if (!partes) throw new Error('El archivo no empieza con un bloque de datos entre líneas «---».');
  const datos = (parse(partes[1]!) ?? {}) as Record<string, unknown>;

  return {
    datos: {
      titulo: texto(datos.titulo),
      descripcion: texto(datos.descripcion),
      categoria: texto(datos.categoria),
      fecha: fecha(datos.fecha),
      borrador: datos.borrador === true,
      material: texto(datos.material),
      destacado: datos.destacado === true,
      portada: foto(datos.portada),
      imagenes: Array.isArray(datos.imagenes) ? datos.imagenes.map(foto) : [],
      videos: textos(datos.videos),
      instagram: textos(datos.instagram),
    },
    cuerpo: partes[2]!.trim(),
  };
}

/**
 * Genera el `index.md`: campos en orden fijo, fotos con `./`, sin los opcionales vacíos
 * ni los booleanos en su valor por defecto (`borrador` y `destacado` solo si valen `true`).
 */
export function escribirTrabajo({ datos, cuerpo }: Trabajo): string {
  const conTexto = (valor: string) => valor.trim() !== '';
  const ruta = (src: string) => `./${sinPuntoBarra(src.trim())}`;

  const frontmatter: Record<string, unknown> = {
    titulo: datos.titulo.trim(),
    descripcion: datos.descripcion.trim(),
    categoria: datos.categoria.trim(),
    fecha: datos.fecha.trim(),
  };
  if (datos.borrador) frontmatter.borrador = true;
  if (conTexto(datos.material)) frontmatter.material = datos.material.trim();
  if (datos.destacado) frontmatter.destacado = true;
  frontmatter.portada = { src: ruta(datos.portada.src), alt: datos.portada.alt.trim() };

  const imagenes = datos.imagenes
    .filter((imagen) => conTexto(imagen.src))
    .map((imagen) => (conTexto(imagen.alt) ? { src: ruta(imagen.src), alt: imagen.alt.trim() } : { src: ruta(imagen.src) }));
  if (imagenes.length > 0) frontmatter.imagenes = imagenes;

  const videos = datos.videos.map((v) => v.trim()).filter(conTexto);
  if (videos.length > 0) frontmatter.videos = videos;
  const instagram = datos.instagram.map((v) => v.trim()).filter(conTexto);
  if (instagram.length > 0) frontmatter.instagram = instagram;

  // `lineWidth: 0`: sin partir líneas largas, como en los archivos escritos a mano.
  const yaml = stringify(frontmatter, { lineWidth: 0 });
  return `---\n${yaml}---\n\n${cuerpo.trim()}\n`;
}

/** Nombres de las fotos a las que apunta un trabajo (portada y adicionales). */
export function fotosReferenciadas(datos: DatosTrabajo): string[] {
  return [datos.portada, ...datos.imagenes].map((f) => sinPuntoBarra(f.src)).filter(Boolean);
}
