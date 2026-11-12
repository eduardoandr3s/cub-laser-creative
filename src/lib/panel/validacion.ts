import { parseInstagram } from '../instagram';
import { MAX_DESCRIPCION } from '../limites';
import { parseYouTube } from '../youtube';
import type { DatosTrabajo } from './markdown';
import { esSlugValido } from './rutas';

/**
 * Validación del formulario del panel con las mismas reglas que el schema de los trabajos
 * (`src/content.config.ts`), para avisar antes de guardar de lo que haría fallar el build.
 */

/** Error de un campo. `campo` usa la misma ruta que el schema: `titulo`, `portada.alt`, `videos.2`… */
export interface ErrorCampo {
  campo: string;
  mensaje: string;
}

export interface ContextoValidacion {
  /** Identificadores de las categorías existentes. */
  categorias: readonly string[];
  /** Solo al crear: el identificador elegido y los de los trabajos que ya existen. */
  nuevo?: { slug: string; existentes: readonly string[] };
}

const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

function fechaValida(fecha: string): boolean {
  const partes = FECHA.exec(fecha);
  if (!partes) return false;
  const [anio, mes, dia] = partes.slice(1).map(Number) as [number, number, number];
  const real = new Date(Date.UTC(anio, mes - 1, dia));
  return real.getUTCFullYear() === anio && real.getUTCMonth() === mes - 1 && real.getUTCDate() === dia;
}

const plural = (n: number, singular: string, varios: string) => (n === 1 ? singular : varios);

/** Pasa un título a identificador: minúsculas, sin tildes y con guiones (`Caja grabada` → `caja-grabada`). */
export function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 80)
    .replace(/^-+|-+$/g, '');
}

export function validarTrabajo(datos: DatosTrabajo, contexto: ContextoValidacion): ErrorCampo[] {
  const errores: ErrorCampo[] = [];
  const error = (campo: string, mensaje: string) => errores.push({ campo, mensaje });

  if (contexto.nuevo) {
    const { slug, existentes } = contexto.nuevo;
    if (!esSlugValido(slug)) {
      error('slug', 'Usa solo letras minúsculas sin tildes, números y guiones (por ejemplo, caja-grabada).');
    } else if (existentes.includes(slug)) {
      error('slug', 'Ya hay un trabajo con este identificador: cámbialo para que la dirección sea distinta.');
    }
  }

  if (!datos.titulo.trim()) error('titulo', 'Escribe un título.');

  const descripcion = datos.descripcion.trim();
  if (!descripcion) {
    error('descripcion', 'Escribe una descripción corta.');
  } else if (descripcion.length > MAX_DESCRIPCION) {
    const sobra = descripcion.length - MAX_DESCRIPCION;
    error(
      'descripcion',
      `${plural(sobra, 'Sobra', 'Sobran')} ${sobra} ${plural(sobra, 'carácter', 'caracteres')}: el máximo es ${MAX_DESCRIPCION}.`,
    );
  }

  if (!datos.categoria) {
    error('categoria', 'Elige una categoría.');
  } else if (!contexto.categorias.includes(datos.categoria)) {
    error('categoria', `La categoría «${datos.categoria}» no existe: elige una de la lista.`);
  }

  if (!fechaValida(datos.fecha.trim())) error('fecha', 'Pon una fecha válida.');

  if (!datos.portada.src) {
    error('portada.src', 'Falta la foto de portada.');
  } else if (!datos.portada.alt.trim()) {
    error(
      'portada.alt',
      'Describe la foto de portada en una frase: la leen los lectores de pantalla y Google.',
    );
  }

  datos.videos.forEach((enlace, i) => {
    if (!enlace.trim()) {
      error(`videos.${i}`, 'Pega un enlace o quita esta fila.');
    } else if (!parseYouTube(enlace)) {
      error(
        `videos.${i}`,
        'No es un enlace de YouTube. Usa uno como https://www.youtube.com/watch?v=…, https://youtu.be/… o https://www.youtube.com/shorts/…',
      );
    }
  });

  datos.instagram.forEach((enlace, i) => {
    if (!enlace.trim()) {
      error(`instagram.${i}`, 'Pega un enlace o quita esta fila.');
    } else if (!parseInstagram(enlace)) {
      error(
        `instagram.${i}`,
        'No es el enlace de una publicación o un reel. Usa uno como https://www.instagram.com/p/… o https://www.instagram.com/reel/… (no el de un perfil o una historia).',
      );
    }
  });

  return errores;
}
