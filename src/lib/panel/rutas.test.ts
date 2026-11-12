import { describe, expect, it } from 'vitest';
import { esArchivoDeTrabajo, esSlugValido, rutaArchivo, siguienteNombreFoto } from './rutas';

describe('esSlugValido', () => {
  it.each(['caja-grabada', 'llaveros-boda-ana-luis', 'trabajo2', 'a'])('acepta %s', (slug) => {
    expect(esSlugValido(slug)).toBe(true);
  });

  it.each([
    '',
    '../otro',
    'caja/grabada',
    'Caja-grabada',
    'caja grabada',
    'caja--grabada',
    '-caja',
    'caja-',
    'cañón',
    'caja.md',
    'a'.repeat(81),
  ])('rechaza %j', (slug) => {
    expect(esSlugValido(slug)).toBe(false);
  });
});

describe('esArchivoDeTrabajo', () => {
  it.each(['index.md', 'portada.jpg', 'detalle-1.jpg', 'foto-12.jpeg', 'foto-3.png', 'foto-4.webp'])(
    'acepta %s',
    (nombre) => {
      expect(esArchivoDeTrabajo(nombre)).toBe(true);
    },
  );

  it.each([
    'otro.md',
    'INDEX.md',
    'Portada.jpg',
    'foto 1.jpg',
    '../index.md',
    'sub/foto.jpg',
    'foto.gif',
    'foto.jpg.exe',
    'script.js',
    '.jpg',
  ])('rechaza %s', (nombre) => {
    expect(esArchivoDeTrabajo(nombre)).toBe(false);
  });
});

describe('rutaArchivo', () => {
  it('construye la ruta dentro de la carpeta del trabajo', () => {
    expect(rutaArchivo('caja-grabada', 'foto-1.jpg')).toBe('src/content/trabajos/caja-grabada/foto-1.jpg');
  });

  it.each([
    ['../../config', 'negocio.ts'],
    ['caja', '../otro-trabajo/index.md'],
    ['caja', 'negocio.ts'],
  ])('lanza un error con %s / %s', (slug, archivo) => {
    expect(() => rutaArchivo(slug, archivo)).toThrow();
  });
});

describe('siguienteNombreFoto', () => {
  it('usa el primer número libre', () => {
    expect(siguienteNombreFoto([])).toBe('foto-1.jpg');
    expect(siguienteNombreFoto(['portada.jpg', 'foto-1.jpg', 'foto-3.jpg'])).toBe('foto-2.jpg');
  });
});
