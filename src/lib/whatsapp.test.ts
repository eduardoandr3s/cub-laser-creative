import { describe, expect, it } from 'vitest';
import { enlaceWhatsApp, mensajeTrabajo } from './whatsapp';

describe('enlaceWhatsApp', () => {
  it('genera un enlace wa.me con el número', () => {
    expect(enlaceWhatsApp('34600000000', 'Hola')).toBe('https://wa.me/34600000000?text=Hola');
  });

  it('codifica ¿, ñ, acentos, espacios y saltos de línea', () => {
    const mensaje = 'Hola, ¿pueden grabar un diseño para el cumpleaños de mi niña?\nGracias';
    const enlace = enlaceWhatsApp('34600000000', mensaje);
    const texto = enlace.split('?text=')[1];

    expect(texto).toContain('%C2%BF'); // ¿
    expect(texto).toContain('dise%C3%B1o'); // ñ
    expect(texto).toContain('cumplea%C3%B1os');
    expect(texto).toContain('%20'); // espacio
    expect(texto).toContain('%0A'); // salto de línea
    expect(texto).not.toMatch(/[\s¿ñ?]/);
    expect(decodeURIComponent(texto)).toBe(mensaje);
  });

  it('codifica los acentos', () => {
    const texto = enlaceWhatsApp('34600000000', 'Información útil').split('?text=')[1];
    expect(texto).toBe('Informaci%C3%B3n%20%C3%BAtil');
  });
});

describe('mensajeTrabajo', () => {
  it('incluye el título y la URL absoluta de la ficha', () => {
    const url = 'https://cublasercreative.es/trabajos/caja-grabada/';
    const mensaje = mensajeTrabajo('Caja grabada', url);

    expect(mensaje).toContain('Caja grabada');
    expect(mensaje).toContain(url);
  });

  it('acepta un objeto URL', () => {
    const url = new URL('/trabajos/caja-grabada/', 'https://cublasercreative.es');
    expect(mensajeTrabajo('Caja grabada', url)).toContain(
      'https://cublasercreative.es/trabajos/caja-grabada/',
    );
  });
});
