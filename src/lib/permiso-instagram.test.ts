import { describe, expect, it } from 'vitest';
import { concederPermiso, permisoConcedido, retirarPermiso, type Almacen } from './permiso-instagram';

function almacenEnMemoria(): Almacen {
  const datos = new Map<string, string>();
  return {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => void datos.set(clave, valor),
    removeItem: (clave) => void datos.delete(clave),
  };
}

const almacenBloqueado: Almacen = {
  getItem: () => {
    throw new DOMException('Bloqueado', 'SecurityError');
  },
  setItem: () => {
    throw new DOMException('Bloqueado', 'SecurityError');
  },
  removeItem: () => {
    throw new DOMException('Bloqueado', 'SecurityError');
  },
};

describe('permiso de Instagram', () => {
  it('no está concedido al principio', () => {
    expect(permisoConcedido(almacenEnMemoria())).toBe(false);
  });

  it('se recuerda al concederlo y se olvida al retirarlo', () => {
    const almacen = almacenEnMemoria();
    expect(concederPermiso(almacen)).toBe(true);
    expect(permisoConcedido(almacen)).toBe(true);
    retirarPermiso(almacen);
    expect(permisoConcedido(almacen)).toBe(false);
  });

  it('no falla si el almacenamiento está bloqueado', () => {
    expect(concederPermiso(almacenBloqueado)).toBe(false);
    expect(permisoConcedido(almacenBloqueado)).toBe(false);
    expect(() => retirarPermiso(almacenBloqueado)).not.toThrow();
  });

  it('no falla si no hay almacenamiento', () => {
    expect(concederPermiso(null)).toBe(false);
    expect(permisoConcedido(null)).toBe(false);
    expect(() => retirarPermiso(null)).not.toThrow();
  });
});
