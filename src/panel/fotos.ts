/**
 * Reducción de fotos en el navegador antes de subirlas: máximo 2400 px en el lado mayor,
 * con la orientación con que se hizo la foto y en JPEG. Al volver a codificarla se pierden
 * todos los metadatos (EXIF), también la ubicación GPS.
 */

export const LADO_MAXIMO = 2400;
const CALIDAD = 0.82;

export interface FotoReducida {
  blob: Blob;
  base64: string;
  ancho: number;
  alto: number;
}

export class ErrorFoto extends Error {}

/** Tamaño final manteniendo la proporción, sin ampliar las fotos pequeñas. */
export function medidasReducidas(ancho: number, alto: number, maximo = LADO_MAXIMO) {
  const escala = Math.min(1, maximo / Math.max(ancho, alto));
  return { ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) };
}

function aBase64(blob: Blob): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result).replace(/^data:[^,]*,/, ''));
    lector.onerror = () => rechazar(new ErrorFoto('No se ha podido leer la foto.'));
    lector.readAsDataURL(blob);
  });
}

export async function reducirFoto(archivo: File): Promise<FotoReducida> {
  let imagen: ImageBitmap;
  try {
    imagen = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  } catch {
    throw new ErrorFoto(
      `«${archivo.name}»: este formato no se puede leer en este navegador. Guarda la foto como JPG y vuelve a subirla.`,
    );
  }

  const { ancho, alto } = medidasReducidas(imagen.width, imagen.height);
  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const contexto = lienzo.getContext('2d');
  if (!contexto) throw new ErrorFoto('El navegador no puede procesar fotos.');
  // Fondo blanco por si la foto es un PNG con transparencia (el JPEG no la admite).
  contexto.fillStyle = '#ffffff';
  contexto.fillRect(0, 0, ancho, alto);
  contexto.imageSmoothingQuality = 'high';
  contexto.drawImage(imagen, 0, 0, ancho, alto);
  imagen.close();

  const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, 'image/jpeg', CALIDAD));
  if (!blob) throw new ErrorFoto(`«${archivo.name}»: no se ha podido preparar la foto.`);
  return { blob, base64: await aBase64(blob), ancho, alto };
}
