import { existsSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { defineCollection, reference } from 'astro:content';
import { glob, type Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { parseYouTube } from './lib/youtube';

/**
 * Comprueba que existen las fotos de un trabajo. El error de Astro solo nombra
 * la foto (y todas se llaman `./portada.jpg`), así que este nombra el trabajo y el campo.
 */
function comprobarFotos(datos: Record<string, unknown>, archivo: string) {
  type Foto = { src?: unknown } | undefined;
  const imagenes = Array.isArray(datos.imagenes) ? (datos.imagenes as Foto[]) : [];
  const fotos: [string, unknown][] = [
    ['portada.src', (datos.portada as Foto)?.src],
    ...imagenes.map((foto, i): [string, unknown] => [`imagenes.${i}.src`, foto?.src]),
  ];

  for (const [campo, src] of fotos) {
    if (typeof src !== 'string' || !src || /^([a-z]+:|\/|@|~)/i.test(src)) continue;
    if (!existsSync(resolve(dirname(archivo), src))) {
      throw new Error(
        `[trabajos] ${relative(process.cwd(), archivo)} → campo "${campo}": no existe la foto "${src}". ` +
          'Revisa que el nombre coincida con el de un archivo de la carpeta del trabajo.',
      );
    }
  }
}

/** El loader `glob` de Astro, con la comprobación de fotos antes de validar cada trabajo. */
function globConFotos(opciones: Parameters<typeof glob>[0]): Loader {
  const loader = glob(opciones);
  return {
    ...loader,
    load: (contexto) =>
      loader.load({
        ...contexto,
        parseData: (entrada) => {
          if (entrada.filePath) comprobarFotos(entrada.data, entrada.filePath);
          return contexto.parseData(entrada);
        },
      }),
  };
}

/** Una categoría por archivo: `src/content/categorias/<slug>.yml`. */
const categorias = defineCollection({
  loader: glob({ pattern: '*.yml', base: './src/content/categorias' }),
  schema: z.object({
    nombre: z.string().trim().min(1),
    orden: z.number().int(),
    // Se usa como descripción de su página en Google: máximo 160 caracteres.
    descripcion: z.string().trim().max(160).optional(),
  }),
});

const videoYouTube = z.string().transform((enlace, ctx) => {
  const video = parseYouTube(enlace);
  if (!video) {
    ctx.addIssue({
      code: 'custom',
      message: `"${enlace}" no es un enlace de YouTube. Usa un enlace como https://www.youtube.com/watch?v=..., https://youtu.be/... o https://www.youtube.com/shorts/...`,
    });
    return z.NEVER;
  }
  return video;
});

/** Un trabajo por carpeta: `src/content/trabajos/<slug>/index.md` + sus fotos. */
const trabajos = defineCollection({
  loader: globConFotos({
    pattern: '*/index.md',
    base: './src/content/trabajos',
    // El slug es el nombre de la carpeta (sin "/index").
    generateId: ({ entry }) => entry.split('/')[0]!,
  }),
  schema: ({ image }) =>
    z.object({
      titulo: z.string().trim().min(1),
      descripcion: z.string().trim().min(1).max(160),
      categoria: reference('categorias'),
      fecha: z.coerce.date(),
      portada: z.object({
        src: image(),
        alt: z.string().trim().min(1),
      }),
      imagenes: z
        .array(
          z.object({
            src: image(),
            alt: z.string().trim().optional(),
          }),
        )
        .default([]),
      videos: z.array(videoYouTube).default([]),
      material: z.string().trim().optional(),
      destacado: z.boolean().default(false),
      borrador: z.boolean().default(false),
    }),
});

export const collections = { categorias, trabajos };
