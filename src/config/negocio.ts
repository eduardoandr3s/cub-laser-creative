import { z } from 'astro/zod';

/**
 * Datos del negocio: el único lugar donde se escriben.
 * Ningún otro archivo del sitio debe repetir estos valores.
 */
const datosNegocio: z.input<typeof esquemaNegocio> = {
  nombre: 'CUB Laser Creative',
  eslogan: 'Corte y Grabado a Todo Color',
  // Máximo 160 caracteres: es la descripción de la página de inicio en Google.
  descripcion:
    'Corte láser e impresión a todo color sobre madera en Valencia: llaveros, placas, marcos y detalles personalizados para eventos y empresas.',
  // URL pública del sitio (dominio propio). Se usa en enlaces canónicos, sitemap y vistas previas.
  url: 'https://cublasercreative.es',
  ubicacion: {
    localidad: 'Valencia',
    provincia: 'Valencia',
    pais: 'ES',
    zonaServicio: ['Valencia', 'Área metropolitana de Valencia', 'Comunidad Valenciana'],
  },
  whatsapp: {
    // Solo dígitos, con prefijo de país y sin "+" ni espacios.
    numero: '34662368153',
    mensajeGenerico: 'Hola, me gustaría pedir información sobre un diseño personalizado.',
  },
  // Solo se muestran las redes que tengan URL. Ejemplo:
  // instagram: 'https://www.instagram.com/cublasercreative/',
  redes: {},
  // Datos del titular para el aviso legal (obligatorios en España antes de publicar).
  legal: {
    titular: undefined, // Nombre y apellidos o razón social
    nif: undefined,
    domicilio: undefined,
    email: undefined,
  },
};

export const NUMERO_WHATSAPP = /^[1-9]\d{7,14}$/;

const texto = z.string().trim().min(1);
const opcional = z
  .string()
  .trim()
  .optional()
  .transform((valor) => valor || undefined);

export const esquemaNegocio = z.object({
  nombre: texto,
  eslogan: texto,
  descripcion: texto.max(160),
  url: z.url({ protocol: /^https?$/ }),
  ubicacion: z.object({
    localidad: texto,
    provincia: texto,
    pais: z.string().length(2),
    zonaServicio: z.array(texto).min(1),
  }),
  whatsapp: z.object({
    numero: z.string().trim(),
    mensajeGenerico: texto,
  }),
  redes: z
    .object({
      instagram: z.url().optional(),
      tiktok: z.url().optional(),
      facebook: z.url().optional(),
      youtube: z.url().optional(),
    })
    .default({}),
  legal: z
    .object({
      titular: opcional,
      nif: opcional,
      domicilio: opcional,
      email: z.email().optional(),
    })
    .prefault({}),
});

export type Negocio = z.output<typeof esquemaNegocio>;

const NOMBRES_LEGALES: Record<keyof Negocio['legal'], string> = {
  titular: 'titular',
  nif: 'NIF',
  domicilio: 'domicilio',
  email: 'email',
};

/**
 * Valida los datos del negocio. Un número de WhatsApp inválido detiene el build
 * de producción y en desarrollo solo avisa; los datos legales ausentes solo avisan.
 */
export function validarNegocio(datos: unknown, { prod }: { prod: boolean }): Negocio {
  const resultado = esquemaNegocio.safeParse(datos);
  if (!resultado.success) {
    throw new Error(
      `[negocio] Datos del negocio no válidos en src/config/negocio.ts:\n${z.prettifyError(resultado.error)}`,
    );
  }
  const negocio = resultado.data;

  if (!NUMERO_WHATSAPP.test(negocio.whatsapp.numero)) {
    const mensaje =
      `[negocio] El número de WhatsApp "${negocio.whatsapp.numero}" no es válido. ` +
      'Formato esperado: solo dígitos, con prefijo de país y sin "+", espacios ni símbolos ' +
      '(entre 8 y 15 dígitos), por ejemplo 34612345678. Corrígelo en src/config/negocio.ts.';
    if (prod) throw new Error(mensaje);
    console.warn(`${mensaje} Los botones de WhatsApp se mostrarán desactivados.`);
  }

  const faltan = (Object.keys(NOMBRES_LEGALES) as (keyof Negocio['legal'])[])
    .filter((campo) => !negocio.legal[campo])
    .map((campo) => NOMBRES_LEGALES[campo]);
  if (faltan.length > 0) {
    console.warn(
      `[negocio] Faltan datos legales en src/config/negocio.ts: ${faltan.join(', ')}. ` +
        'El aviso legal quedará incompleto hasta que los añadas.',
    );
  }

  return negocio;
}

export const negocio = validarNegocio(datosNegocio, { prod: import.meta.env?.PROD ?? false });

/** `false` si el número no es válido (solo puede pasar en desarrollo). */
export const whatsappActivo = NUMERO_WHATSAPP.test(negocio.whatsapp.numero);
