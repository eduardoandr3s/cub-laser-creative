export interface VideoYouTube {
  id: string;
  /** `true` para los Shorts, que se muestran en 9:16. */
  vertical: boolean;
}

const ID_VIDEO = /^[A-Za-z0-9_-]{11}$/;
const DOMINIOS_YOUTUBE = new Set(['youtube.com', 'youtube-nocookie.com']);

/**
 * Interpreta un enlace de YouTube (`watch?v=`, `youtu.be/`, `embed/`, `shorts/`)
 * o un id suelto de 11 caracteres. Devuelve `null` si no es un video de YouTube.
 */
export function parseYouTube(entrada: string): VideoYouTube | null {
  const texto = entrada.trim();
  if (ID_VIDEO.test(texto)) return { id: texto, vertical: false };

  let url: URL;
  try {
    url = new URL(/^[a-z]+:\/\//i.test(texto) ? texto : `https://${texto}`);
  } catch {
    return null;
  }

  const dominio = url.hostname.toLowerCase().replace(/^(www|m)\./, '');
  const [, tipo, valor] = url.pathname.split('/');
  let id: string | null = null;
  let vertical = false;

  if (dominio === 'youtu.be') {
    id = tipo ?? null;
  } else if (DOMINIOS_YOUTUBE.has(dominio)) {
    if (tipo === 'watch') {
      id = url.searchParams.get('v');
    } else if (tipo === 'embed' || tipo === 'shorts') {
      id = valor ?? null;
      vertical = tipo === 'shorts';
    }
  }

  return id && ID_VIDEO.test(id) ? { id, vertical } : null;
}
