import { urlArchivo } from './api';
import type { Categoria, TrabajoGuardado } from './datos';
import { estilos, h } from './dom';

const formatoFecha = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function fechaLegible(fecha: string): string {
  const valor = new Date(`${fecha}T00:00:00Z`);
  return Number.isNaN(valor.getTime()) ? fecha : formatoFecha.format(valor);
}

function tarjeta({ slug, archivos, trabajo, error }: TrabajoGuardado, categorias: Categoria[]) {
  if (!trabajo) {
    return h(
      'li',
      { class: `${estilos.tarjeta} text-magenta-texto` },
      h('p', { class: 'font-semibold' }, slug),
      h('p', { class: 'text-sm' }, `No se puede leer este trabajo: ${error ?? 'formato desconocido'}.`),
    );
  }

  const { datos } = trabajo;
  const shaPortada = archivos[datos.portada.src];
  const categoria = categorias.find((c) => c.id === datos.categoria)?.nombre ?? datos.categoria;

  return h(
    'li',
    { class: 'flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-tinta/10' },
    h(
      'a',
      { href: `#/trabajo/${slug}`, class: 'group flex flex-1 gap-4 p-3 hover:bg-tinta/5' },
      shaPortada
        ? h('img', {
            src: urlArchivo(shaPortada, datos.portada.src),
            alt: '',
            loading: 'lazy',
            decoding: 'async',
            class: 'size-20 shrink-0 rounded-xl bg-madera object-cover',
          })
        : h('span', { class: 'size-20 shrink-0 rounded-xl bg-madera' }),
      h(
        'span',
        { class: 'flex min-w-0 flex-col gap-1' },
        h('span', { class: 'font-bold group-hover:underline' }, datos.titulo || slug),
        h('span', { class: 'text-sm text-tinta-suave' }, `${categoria} · ${fechaLegible(datos.fecha)}`),
        h(
          'span',
          {
            class: datos.borrador
              ? 'self-start rounded-full bg-ambar px-2 py-0.5 text-xs font-bold text-tinta'
              : 'self-start rounded-full bg-exito px-2 py-0.5 text-xs font-bold text-tinta',
          },
          datos.borrador ? 'Borrador' : 'Publicado',
        ),
      ),
    ),
    !datos.borrador &&
      h(
        'a',
        {
          href: `/trabajos/${slug}/`,
          target: '_blank',
          rel: 'noopener',
          class: `${estilos.enlace} inline-flex min-h-11 items-center border-t border-tinta/10 px-3 text-sm`,
        },
        'Ver en la web',
        h('span', { class: 'sr-only' }, ` (${datos.titulo}, se abre en una pestaña nueva)`),
      ),
  );
}

export function vistaLista(trabajos: TrabajoGuardado[], categorias: Categoria[]): HTMLElement {
  const borradores = trabajos.filter((t) => t.trabajo?.datos.borrador).length;
  return h(
    'section',
    { 'aria-labelledby': 'titulo-lista' },
    h(
      'div',
      { class: 'flex flex-wrap items-end justify-between gap-4' },
      h(
        'div',
        {},
        h('h1', { id: 'titulo-lista', tabindex: '-1', class: 'text-3xl font-extrabold tracking-tight' }, 'Trabajos'),
        h(
          'p',
          { class: 'mt-1 text-tinta-suave' },
          trabajos.length === 1 ? '1 trabajo' : `${trabajos.length} trabajos`,
          borradores ? ` (${borradores} en borrador)` : '',
        ),
      ),
      h('a', { href: '#/nuevo', class: estilos.botonPrincipal }, '+ Nuevo trabajo'),
    ),
    trabajos.length === 0
      ? h('p', { class: `${estilos.tarjeta} mt-6` }, 'Todavía no hay trabajos. Crea el primero con «Nuevo trabajo».')
      : h(
          'ul',
          { class: 'mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3' },
          ...trabajos.map((trabajo) => tarjeta(trabajo, categorias)),
        ),
  );
}
