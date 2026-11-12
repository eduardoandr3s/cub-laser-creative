import * as api from './api';
import { cargarContenido, type Categoria, type TrabajoGuardado } from './datos';
import { estilos, h } from './dom';
import { vistaFormulario, type VistaFormulario } from './formulario';
import { vistaLista } from './lista';
import { crearEstadoPublicacion } from './publicacion';

/**
 * Arranque del panel: lee los trabajos del repositorio y muestra la lista (`#/`), un trabajo
 * (`#/trabajo/<slug>`) o el formulario de uno nuevo (`#/nuevo`).
 */

let trabajos: TrabajoGuardado[] = [];
let categorias: Categoria[] = [];
let actual: VistaFormulario | null = null;
let hashActual = '';

const contenedor = () => document.querySelector<HTMLElement>('[data-vista]')!;
const avisoGlobal = crearEstadoPublicacion();

function mostrar(vista: HTMLElement, enfocar = true) {
  contenedor().replaceChildren(vista);
  window.scrollTo(0, 0);
  if (enfocar) vista.querySelector<HTMLElement>('h1')?.focus();
}

function pintarRuta(enfocar = true) {
  actual?.cerrar();
  actual = null;
  hashActual = location.hash;
  const ruta = location.hash.replace(/^#\/?/, '');

  if (ruta === 'nuevo' || ruta.startsWith('trabajo/')) {
    avisoGlobal.parar();
    avisoGlobal.elemento.replaceChildren();
    const slug = ruta.slice('trabajo/'.length);
    const guardado = ruta === 'nuevo' ? null : trabajos.find((t) => t.slug === slug);
    if (guardado === undefined || (guardado && !guardado.trabajo)) {
      mostrar(h('div', {},
        h('h1', { tabindex: '-1', class: 'text-2xl font-bold' }, 'No se encuentra este trabajo'),
        h('p', { class: 'mt-3' }, h('a', { href: '#/', class: estilos.enlace }, 'Volver a la lista'))), enfocar);
      return;
    }
    actual = vistaFormulario(
      {
        trabajos,
        categorias,
        alGuardar(trabajo) {
          trabajos = [...trabajos.filter((t) => t.slug !== trabajo.slug), trabajo].sort(
            (a, b) => (b.trabajo?.datos.fecha ?? '').localeCompare(a.trabajo?.datos.fecha ?? '') || a.slug.localeCompare(b.slug),
          );
        },
        alEliminar(slugEliminado, titulo, commit) {
          trabajos = trabajos.filter((t) => t.slug !== slugEliminado);
          location.hash = '#/';
          avisoGlobal.seguir(commit, {
            publicando: `«${titulo}» eliminado. Quitándolo de la web…`,
            publicado: `«${titulo}» eliminado: ya no aparece en la web.`,
          });
        },
        recargar(slugARecargar) {
          void cargar(`#/trabajo/${slugARecargar}`);
        },
        fijarRuta(hash) {
          // Sin esto, volver a «#/nuevo» no se detectaría como un cambio de ruta.
          history.replaceState(null, '', hash);
          hashActual = location.hash;
        },
      },
      guardado,
    );
    mostrar(actual.elemento, enfocar);
    return;
  }

  mostrar(vistaLista(trabajos, categorias), enfocar);
}

function alCambiarRuta() {
  if (location.hash === hashActual) return;
  if (actual?.sinGuardar() && !confirm('Tienes cambios sin guardar (o fotos subiéndose). ¿Salir sin guardarlos?')) {
    history.pushState(null, '', hashActual || '#/');
    return;
  }
  pintarRuta();
}

async function cargar(destino?: string) {
  contenedor().replaceChildren(h('p', { class: 'text-tinta-suave', role: 'status' }, 'Cargando los trabajos…'));
  try {
    ({ trabajos, categorias } = await cargarContenido());
  } catch (error) {
    contenedor().replaceChildren(
      h('div', { role: 'alert', class: `${estilos.tarjeta} max-w-xl` },
        h('p', { class: 'font-semibold text-magenta-texto' }, (error as Error).message),
        h('button', { type: 'button', class: `${estilos.botonSecundario} mt-4`, onClick: () => cargar(destino) }, 'Volver a intentarlo')),
    );
    return;
  }
  if (destino && location.hash !== destino) {
    history.replaceState(null, '', destino);
  }
  pintarRuta(false);
}

export async function iniciarPanel() {
  document.querySelector('[data-aviso-global]')?.replaceChildren(avisoGlobal.elemento);
  window.addEventListener('hashchange', alCambiarRuta);

  api.sesion().then(
    ({ correo }) => {
      const sesion = document.querySelector('[data-sesion]');
      if (sesion) sesion.textContent = correo;
    },
    () => undefined,
  );
  await cargar();
}
