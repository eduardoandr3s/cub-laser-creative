import * as api from './api';
import { estilos, h } from './dom';

/**
 * Aviso de publicación después de guardar: consulta `/version.json` cada 10 s hasta que la
 * versión publicada incluye el commit guardado, o avisa a los 5 minutos de que no ha llegado.
 */

const INTERVALO = 10_000;
const ESPERA_MAXIMA = 5 * 60_000;

export interface TextosPublicacion {
  publicando: string;
  publicado: string;
  /** Enlace a la web cuando ya está publicado. */
  enlace?: string;
}

export function crearEstadoPublicacion() {
  const elemento = h('div', { role: 'status', class: 'empty:hidden' });
  let temporizador: ReturnType<typeof setTimeout> | undefined;

  const pintar = (clase: string, ...contenido: (Node | string)[]) => {
    elemento.replaceChildren(h('p', { class: `rounded-2xl p-4 ${clase}` }, ...contenido));
  };

  function parar() {
    clearTimeout(temporizador);
    temporizador = undefined;
  }

  return {
    elemento,
    parar,
    /** Muestra un aviso sin seguimiento (por ejemplo, al guardar un borrador). */
    mensaje(texto: string) {
      parar();
      pintar('bg-madera', texto);
    },
    seguir(commit: string, textos: TextosPublicacion) {
      parar();
      const inicio = Date.now();
      pintar('bg-madera', textos.publicando);

      const comprobar = async () => {
        const publicado = await api.versionPublicada();
        let listo = publicado === commit;
        if (!listo && publicado) listo = await api.incluye(commit, publicado).then((r) => r.incluye, () => false);
        if (listo) {
          temporizador = undefined;
          pintar(
            'bg-exito',
            textos.publicado,
            ...(textos.enlace ? [' ', h('a', { href: textos.enlace, class: estilos.enlace }, 'Ver en la web')] : []),
          );
        } else if (Date.now() - inicio > ESPERA_MAXIMA) {
          temporizador = undefined;
          pintar(
            'bg-madera text-magenta-texto font-semibold',
            'La web todavía no se ha actualizado y puede que la publicación haya fallado: la web sigue mostrando la versión anterior. Si en unos minutos sigue igual, avisa a quien mantiene la web.',
          );
        } else {
          temporizador = setTimeout(comprobar, INTERVALO);
        }
      };
      temporizador = setTimeout(comprobar, INTERVALO);
    },
  };
}
