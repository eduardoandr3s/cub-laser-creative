/** Utilidades mínimas para construir la interfaz del panel sin framework. */

export type Hijo = Node | string | number | null | undefined | false;
type Propiedades = Record<string, unknown>;

// Se asignan como propiedad del elemento (no como atributo) para reflejar el estado actual.
const PROPIEDADES = new Set(['value', 'checked', 'disabled', 'hidden', 'selected', 'multiple', 'textContent']);

/**
 * Crea un elemento. `class` va a `className`, `onX` añade el evento `x`, y el resto son
 * atributos (`false`, `null` o `undefined` no se escriben).
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  etiqueta: K,
  propiedades: Propiedades = {},
  ...hijos: Hijo[]
): HTMLElementTagNameMap[K] {
  const elemento = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(propiedades)) {
    if (valor === undefined || valor === null || valor === false) continue;
    if (clave === 'class') {
      elemento.className = String(valor);
    } else if (clave.startsWith('on') && typeof valor === 'function') {
      elemento.addEventListener(clave.slice(2).toLowerCase(), valor as EventListener);
    } else if (PROPIEDADES.has(clave)) {
      (elemento as unknown as Record<string, unknown>)[clave] = valor;
    } else {
      elemento.setAttribute(clave, valor === true ? '' : String(valor));
    }
  }
  for (const hijo of hijos) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    elemento.append(hijo instanceof Node ? hijo : String(hijo));
  }
  return elemento;
}

let contador = 0;
/** Identificador único para asociar etiquetas, ayudas y errores. */
export const nuevoId = (prefijo: string) => `${prefijo}-${++contador}`;

/** Clases de los controles, en un solo sitio para que todo el panel se vea igual. */
export const estilos = {
  // `focus-within:` además del foco global: el campo de fecha pone el foco en una parte interna
  // (no cumple `:focus` ni `:focus-visible`) y, sin esto, no se vería.
  campo:
    'mt-1 block w-full min-h-11 rounded-xl border border-tinta/25 bg-white px-3 py-2 text-base focus-within:outline-3 focus-within:outline-offset-3 focus-within:outline-solid focus-within:outline-tinta aria-[invalid=true]:border-magenta aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-magenta',
  etiqueta: 'block font-semibold',
  ayuda: 'mt-1 text-sm text-tinta-suave',
  error: 'mt-1 text-sm font-semibold text-magenta-texto',
  botonPrincipal:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-tinta px-5 py-2 font-bold text-papel transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-50',
  botonSecundario:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 font-semibold ring-2 ring-tinta/70 ring-inset transition-colors hover:bg-tinta/5 disabled:cursor-not-allowed disabled:opacity-50',
  botonPeligro:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 font-semibold text-magenta-texto ring-2 ring-magenta-texto/70 ring-inset transition-colors hover:bg-magenta-texto/5',
  botonPequeno:
    'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-sm font-semibold ring-1 ring-tinta/25 ring-inset hover:bg-tinta/5 disabled:cursor-not-allowed disabled:opacity-40',
  enlace: 'font-semibold text-cian-texto underline underline-offset-2',
  tarjeta: 'rounded-2xl bg-white p-4 ring-1 ring-tinta/10 sm:p-6',
};
