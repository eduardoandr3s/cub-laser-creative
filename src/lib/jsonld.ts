/** Datos del negocio que necesita el JSON-LD (coincide con la configuración del negocio). */
export interface DatosLocalBusiness {
  nombre: string;
  descripcion: string;
  url: string;
  ubicacion: {
    localidad: string;
    provincia: string;
    pais: string;
    zonaServicio: readonly string[];
  };
  whatsapp: { numero: string };
  redes?: Partial<Record<string, string | undefined>>;
}

/** Datos estructurados Schema.org `LocalBusiness` para la página de inicio. */
export function localBusiness(negocio: DatosLocalBusiness) {
  const absoluta = (ruta: string) => new URL(ruta, negocio.url).href;
  const redes = Object.values(negocio.redes ?? {}).filter((url): url is string => Boolean(url));

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': absoluta('/#negocio'),
    name: negocio.nombre,
    description: negocio.descripcion,
    url: absoluta('/'),
    logo: absoluta('/favicon.svg'),
    image: absoluta('/og-default.png'),
    telephone: `+${negocio.whatsapp.numero}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: negocio.ubicacion.localidad,
      addressRegion: negocio.ubicacion.provincia,
      addressCountry: negocio.ubicacion.pais,
    },
    areaServed: negocio.ubicacion.zonaServicio.map((zona) => ({ '@type': 'Place', name: zona })),
    ...(redes.length > 0 && { sameAs: redes }),
  };
}
