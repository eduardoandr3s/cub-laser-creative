export interface PublicacionInstagram {
  codigo: string;
  /** `reel` para los reels; `p` para el resto de publicaciones. */
  tipo: 'p' | 'reel';
  /** Enlace canónico: `https://www.instagram.com/<tipo>/<codigo>/`. */
  url: string;
}

const CODIGO = /^[A-Za-z0-9_-]{5,64}$/;
const DOMINIOS_INSTAGRAM = new Set(['instagram.com', 'instagr.am']);
const TIPOS: Record<string, PublicacionInstagram['tipo']> = { p: 'p', tv: 'p', reel: 'reel', reels: 'reel' };

/**
 * Interpreta el enlace de una publicación o un reel de Instagram (`/p/`, `/reel/`,
 * `/reels/`, `/tv/`), también con el nombre de la cuenta delante
 * (`/<cuenta>/p/<código>`). Devuelve `null` si no es una publicación: perfiles,
 * historias u otros dominios.
 */
export function parseInstagram(entrada: string): PublicacionInstagram | null {
  const texto = entrada.trim();

  let url: URL;
  try {
    url = new URL(/^[a-z]+:\/\//i.test(texto) ? texto : `https://${texto}`);
  } catch {
    return null;
  }

  const dominio = url.hostname.toLowerCase().replace(/^(www|m)\./, '');
  if (!DOMINIOS_INSTAGRAM.has(dominio)) return null;

  const partes = url.pathname.split('/').filter(Boolean);
  // `/p/<código>` o `/<cuenta>/p/<código>`.
  const [tipoTexto, codigo] = partes.length === 3 ? partes.slice(1) : partes;
  if (partes.length < 2 || partes.length > 3 || !tipoTexto || !codigo) return null;

  const tipo = TIPOS[tipoTexto.toLowerCase()];
  if (!tipo || !CODIGO.test(codigo)) return null;

  return { codigo, tipo, url: `https://www.instagram.com/${tipo}/${codigo}/` };
}
