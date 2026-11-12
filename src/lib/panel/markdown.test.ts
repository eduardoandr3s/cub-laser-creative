import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { escribirTrabajo, fotosReferenciadas, leerTrabajo, type Trabajo } from './markdown';

// Dos trabajos de ejemplo guardados aparte, porque el contenido real se puede borrar desde el panel.
const FIXTURES = join(process.cwd(), 'src/lib/panel/fixtures');
const fijos = readdirSync(FIXTURES).map((archivo) => [
  archivo.replace(/\.md$/, ''),
  readFileSync(join(FIXTURES, archivo), 'utf8'),
]);

// Más todos los trabajos que haya en el repositorio, escritos a mano o por el panel.
const CARPETA = join(process.cwd(), 'src/content/trabajos');
const reales = readdirSync(CARPETA).map((slug) => [
  `src/content/trabajos/${slug}`,
  readFileSync(join(CARPETA, slug, 'index.md'), 'utf8'),
]);

const ejemplos = [...fijos, ...reales];

/** El archivo sin las líneas de comentario YAML, que el panel no conserva. */
const sinComentarios = (contenido: string) =>
  contenido
    .split('\n')
    .filter((linea) => !/^\s*#/.test(linea))
    .join('\n');

describe('leerTrabajo y escribirTrabajo', () => {
  it.each(ejemplos)('reescribe %s igual que el original (sin comentarios)', (_slug, original) => {
    expect(escribirTrabajo(leerTrabajo(original))).toBe(sinComentarios(original));
  });

  it('lee los datos de un trabajo con fotos y video', () => {
    const { datos, cuerpo } = leerTrabajo(
      ejemplos.find(([slug]) => slug === 'logo-corporativo-cafeteria')![1],
    );
    expect(datos).toMatchObject({
      titulo: 'Logo corporativo para una cafetería',
      categoria: 'empresas',
      fecha: '2026-05-08',
      borrador: true,
      destacado: true,
      material: 'DM de 5 mm',
      portada: { src: 'portada.jpg' },
      imagenes: [{ src: 'detalle-1.jpg', alt: 'Detalle del canto del logotipo cortado con láser' }],
      videos: [expect.stringMatching(/^https:\/\/www\.youtube\.com\//)],
    });
    expect(cuerpo.startsWith('**Trabajo de ejemplo')).toBe(true);
  });

  it('omite los opcionales vacíos y los booleanos por defecto', () => {
    const trabajo: Trabajo = {
      datos: {
        titulo: 'Caja grabada',
        descripcion: 'Caja de madera grabada con láser.',
        categoria: 'empresas',
        fecha: '2026-11-11',
        borrador: false,
        material: '  ',
        destacado: false,
        portada: { src: 'foto-1.jpg', alt: 'Caja de madera' },
        imagenes: [{ src: 'foto-2.jpg', alt: '' }],
        videos: [''],
        instagram: [' https://www.instagram.com/reel/C8fFxCVOTvz/ '],
      },
      cuerpo: '\nTexto largo.\n\n',
    };
    expect(escribirTrabajo(trabajo)).toBe(
      [
        '---',
        'titulo: Caja grabada',
        'descripcion: Caja de madera grabada con láser.',
        'categoria: empresas',
        'fecha: 2026-11-11',
        'portada:',
        '  src: ./foto-1.jpg',
        '  alt: Caja de madera',
        'imagenes:',
        '  - src: ./foto-2.jpg',
        'instagram:',
        '  - https://www.instagram.com/reel/C8fFxCVOTvz/',
        '---',
        '',
        'Texto largo.',
        '',
      ].join('\n'),
    );
  });

  it('protege los textos que YAML interpretaría de otra forma', () => {
    const trabajo = leerTrabajo('---\ntitulo: x\n---\n');
    trabajo.datos.titulo = 'Placa: "30 años" # gracias';
    trabajo.datos.material = 'true';
    const releido = leerTrabajo(escribirTrabajo(trabajo));
    expect(releido.datos.titulo).toBe('Placa: "30 años" # gracias');
    expect(releido.datos.material).toBe('true');
  });

  it('falla si no hay bloque de datos', () => {
    expect(() => leerTrabajo('Solo texto')).toThrow(/---/);
  });
});

describe('fotosReferenciadas', () => {
  it('devuelve la portada y las adicionales sin ./', () => {
    const { datos } = leerTrabajo(ejemplos.find(([slug]) => slug === 'llaveros-boda-ana-luis')![1]);
    expect(fotosReferenciadas(datos)).toEqual(['portada.jpg', 'detalle-1.jpg', 'detalle-2.jpg', 'detalle-3.jpg']);
  });
});
