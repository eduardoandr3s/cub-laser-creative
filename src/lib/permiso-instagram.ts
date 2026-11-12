/**
 * Permiso del visitante para cargar las publicaciones de Instagram. Se recuerda en
 * `localStorage` (sin cookies). Si el navegador no deja usarlo (modo privado
 * estricto, almacenamiento bloqueado), el permiso solo dura mientras siga abierta la página.
 */

export type Almacen = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const CLAVE = 'cub:permiso-instagram';
const CONCEDIDO = 'concedido';

function almacenDelNavegador(): Almacen | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function permisoConcedido(almacen = almacenDelNavegador()): boolean {
  try {
    return almacen?.getItem(CLAVE) === CONCEDIDO;
  } catch {
    return false;
  }
}

/** Guarda el permiso. Devuelve `false` si no se ha podido recordar. */
export function concederPermiso(almacen = almacenDelNavegador()): boolean {
  try {
    almacen?.setItem(CLAVE, CONCEDIDO);
    return permisoConcedido(almacen);
  } catch {
    return false;
  }
}

export function retirarPermiso(almacen = almacenDelNavegador()): void {
  try {
    almacen?.removeItem(CLAVE);
  } catch {
    // Si no se puede leer el almacenamiento, tampoco se pudo guardar el permiso.
  }
}
