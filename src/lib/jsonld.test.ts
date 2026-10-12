import { describe, expect, it } from 'vitest';
import { localBusiness, type DatosLocalBusiness } from './jsonld';

const base: DatosLocalBusiness = {
  nombre: 'CUB Laser Creative',
  descripcion: 'Corte láser e impresión a todo color sobre madera en Valencia.',
  url: 'https://cublasercreative.es',
  ubicacion: {
    localidad: 'Valencia',
    provincia: 'Valencia',
    pais: 'ES',
    zonaServicio: ['Valencia', 'Área metropolitana de Valencia'],
  },
  whatsapp: { numero: '34600000000' },
};

describe('localBusiness', () => {
  it('incluye nombre, URL, teléfono, dirección en Valencia (ES) y zona de servicio', () => {
    const datos = localBusiness(base);

    expect(datos['@context']).toBe('https://schema.org');
    expect(datos['@type']).toBe('LocalBusiness');
    expect(datos.name).toBe('CUB Laser Creative');
    expect(datos.description).toBe(base.descripcion);
    expect(datos.url).toBe('https://cublasercreative.es/');
    expect(datos.logo).toMatch(/^https:\/\/cublasercreative\.es\//);
    expect(datos.image).toMatch(/^https:\/\/cublasercreative\.es\//);
    expect(datos.telephone).toBe('+34600000000');
    expect(datos.address).toEqual({
      '@type': 'PostalAddress',
      addressLocality: 'Valencia',
      addressRegion: 'Valencia',
      addressCountry: 'ES',
    });
    expect(datos.areaServed).toEqual([
      { '@type': 'Place', name: 'Valencia' },
      { '@type': 'Place', name: 'Área metropolitana de Valencia' },
    ]);
  });

  it('sameAs solo contiene las redes configuradas', () => {
    const datos = localBusiness({
      ...base,
      redes: { instagram: 'https://www.instagram.com/cublasercreative/', tiktok: undefined },
    });
    expect(datos.sameAs).toEqual(['https://www.instagram.com/cublasercreative/']);
  });

  it('no incluye sameAs si no hay redes configuradas', () => {
    expect(localBusiness(base)).not.toHaveProperty('sameAs');
    expect(localBusiness({ ...base, redes: {} })).not.toHaveProperty('sameAs');
  });

  it('se puede serializar a JSON', () => {
    expect(() => JSON.parse(JSON.stringify(localBusiness(base)))).not.toThrow();
  });
});
