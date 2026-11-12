import { describe, expect, it } from 'vitest';
import type { DatosTrabajo } from './markdown';
import { slugificar, validarTrabajo, type ContextoValidacion } from './validacion';

const CATEGORIAS = ['empresas', 'eventos'];

function datosValidos(cambios: Partial<DatosTrabajo> = {}): DatosTrabajo {
  return {
    titulo: 'Caja grabada',
    descripcion: 'Caja de madera grabada con láser.',
    categoria: 'empresas',
    fecha: '2026-11-11',
    borrador: true,
    material: '',
    destacado: false,
    portada: { src: 'foto-1.jpg', alt: 'Caja de madera grabada' },
    imagenes: [{ src: 'foto-2.jpg', alt: '' }],
    videos: ['https://youtu.be/dQw4w9WgXcQ'],
    instagram: ['https://www.instagram.com/reel/C8fFxCVOTvz/'],
    ...cambios,
  };
}

const validar = (cambios: Partial<DatosTrabajo>, contexto: Partial<ContextoValidacion> = {}) =>
  validarTrabajo(datosValidos(cambios), { categorias: CATEGORIAS, ...contexto });

describe('validarTrabajo', () => {
  it('no da errores con un trabajo válido', () => {
    expect(validar({})).toEqual([]);
  });

  it('rechaza un enlace de Vimeo con ejemplos de YouTube', () => {
    const [error] = validar({ videos: ['https://youtu.be/dQw4w9WgXcQ', 'https://vimeo.com/12345'] });
    expect(error?.campo).toBe('videos.1');
    expect(error?.mensaje).toMatch(/YouTube.*youtube\.com\/watch/);
  });

  it('cuenta los caracteres que sobran en la descripción', () => {
    expect(validar({ descripcion: 'a'.repeat(161) })).toEqual([
      { campo: 'descripcion', mensaje: 'Sobra 1 carácter: el máximo es 160.' },
    ]);
    expect(validar({ descripcion: 'a'.repeat(165) })[0]?.mensaje).toBe('Sobran 5 caracteres: el máximo es 160.');
    expect(validar({ descripcion: 'a'.repeat(160) })).toEqual([]);
  });

  it('exige el texto alternativo de la portada', () => {
    expect(validar({ portada: { src: 'foto-1.jpg', alt: '  ' } }).map((e) => e.campo)).toEqual(['portada.alt']);
  });

  it('exige la portada', () => {
    expect(validar({ portada: { src: '', alt: '' } }).map((e) => e.campo)).toEqual(['portada.src']);
  });

  it('rechaza una categoría que no existe', () => {
    expect(validar({ categoria: 'posavasos' })[0]?.campo).toBe('categoria');
  });

  it.each(['', '2026-13-01', '2026-02-30', '11/11/2026'])('rechaza la fecha %j', (fecha) => {
    expect(validar({ fecha }).map((e) => e.campo)).toEqual(['fecha']);
  });

  it('rechaza un perfil de Instagram y las filas vacías', () => {
    const errores = validar({ instagram: ['https://www.instagram.com/cublasercreative/', ''] });
    expect(errores.map((e) => e.campo)).toEqual(['instagram.0', 'instagram.1']);
  });

  it('exige título y descripción', () => {
    expect(validar({ titulo: ' ', descripcion: '' }).map((e) => e.campo)).toEqual(['titulo', 'descripcion']);
  });

  it('rechaza un identificador repetido o mal formado al crear', () => {
    const existentes = ['caja-grabada'];
    expect(validar({}, { nuevo: { slug: 'caja-grabada', existentes } })[0]?.mensaje).toMatch(/Ya hay un trabajo/);
    expect(validar({}, { nuevo: { slug: 'Caja grabada', existentes } })[0]?.campo).toBe('slug');
    expect(validar({}, { nuevo: { slug: 'caja-nueva', existentes } })).toEqual([]);
  });
});

describe('slugificar', () => {
  it.each([
    ['Caja grabada para Lucía', 'caja-grabada-para-lucia'],
    ['  Llaveros: boda de Ana & Luis!  ', 'llaveros-boda-de-ana-luis'],
    ['Señalética Ñandú 2026', 'senaletica-nandu-2026'],
    ['¿¡!?', ''],
  ])('%j → %j', (titulo, slug) => {
    expect(slugificar(titulo)).toBe(slug);
  });

  it('no supera los 80 caracteres ni termina en guion', () => {
    const slug = slugificar(`${'palabra '.repeat(20)}`);
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith('-')).toBe(false);
  });
});
