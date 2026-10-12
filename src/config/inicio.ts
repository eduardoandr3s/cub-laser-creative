import type { NombreIcono } from './iconos';

/**
 * Textos de la página de inicio. Se pueden cambiar, añadir o quitar
 * diferenciales y pasos sin tocar ningún componente.
 */
export const inicio: TextosInicio = {
  hero: {
    titular: 'Regalos personalizados y recuerdos a todo color, hechos con láser',
    subtitulo:
      'Llaveros, placas, marcos y detalles únicos sobre madera real, diseñados a tu medida en Valencia.',
  },

  // Iconos disponibles: ver src/config/iconos.ts
  diferenciales: [
    {
      icono: 'zap',
      titulo: 'Corte láser de precisión',
      texto: 'Nuestro láser de 20 W corta y graba con detalle milimétrico para un acabado limpio.',
    },
    {
      icono: 'palette',
      titulo: 'Impresión a todo color',
      texto: 'Imprimimos tus diseños a todo color directamente sobre madera real.',
    },
    {
      icono: 'pencil-ruler',
      titulo: 'Diseños a medida',
      texto: 'Partimos de tu idea, una foto o tu logo, y la convertimos en una pieza única.',
    },
    {
      icono: 'briefcase-business',
      titulo: 'Eventos y empresas',
      texto: 'Detalles para bodas, comuniones y celebraciones, y regalos corporativos con tu marca.',
    },
  ],

  pasos: [
    {
      titulo: 'Cuéntanos tu idea',
      texto: 'Escríbenos por WhatsApp con lo que tienes en mente: una foto, un texto o un logo.',
    },
    {
      titulo: 'Te enviamos un boceto',
      texto: 'Preparamos el diseño y te lo mandamos para que veas cómo quedará.',
    },
    {
      titulo: 'Aprobación y producción',
      texto: 'Con tu visto bueno, cortamos e imprimimos tu pieza.',
    },
    {
      titulo: 'Entrega',
      texto: 'Te avisamos en cuanto esté lista para que la tengas en tus manos.',
    },
  ],

  ctaFinal: {
    titulo: '¿Tienes una idea en mente?',
    texto: 'Cuéntanosla por WhatsApp y te ayudamos a hacerla realidad.',
  },
};

interface TextosInicio {
  hero: { titular: string; subtitulo: string };
  diferenciales: { icono: NombreIcono; titulo: string; texto: string }[];
  pasos: { titulo: string; texto: string }[];
  ctaFinal: { titulo: string; texto: string };
}
