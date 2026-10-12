import { describe, expect, it } from 'vitest';
import {
  categoriasConTrabajos,
  ordenarPorFecha,
  seleccionarDestacados,
  seleccionarRelacionados,
  type TrabajoSeleccionable,
} from './trabajos';

function trabajo(
  id: string,
  fecha: string,
  { categoria = 'llaveros', destacado = false } = {},
): TrabajoSeleccionable {
  return { id, data: { fecha: new Date(fecha), destacado, categoria: { id: categoria } } };
}

const ids = (lista: TrabajoSeleccionable[]) => lista.map((t) => t.id);

/** 10 trabajos: t1 (más antiguo) … t10 (más reciente). */
const diez = Array.from({ length: 10 }, (_, i) =>
  trabajo(`t${i + 1}`, `2026-01-${String(i + 1).padStart(2, '0')}`),
);

describe('ordenarPorFecha', () => {
  it('ordena de más reciente a más antiguo sin modificar la lista original', () => {
    const a = trabajo('a', '2026-03-01');
    const b = trabajo('b', '2026-05-10');
    const lista = [a, b];

    expect(ids(ordenarPorFecha(lista))).toEqual(['b', 'a']);
    expect(ids(lista)).toEqual(['a', 'b']);
  });
});

describe('seleccionarDestacados', () => {
  it('sin destacados marcados, devuelve los 6 más recientes', () => {
    expect(ids(seleccionarDestacados(diez))).toEqual(['t10', 't9', 't8', 't7', 't6', 't5']);
  });

  it('con destacados marcados, devuelve solo esos, por fecha', () => {
    const lista = [
      trabajo('viejo', '2026-01-01', { destacado: true }),
      trabajo('nuevo', '2026-06-01', { destacado: true }),
      trabajo('normal', '2026-09-01'),
    ];
    expect(ids(seleccionarDestacados(lista))).toEqual(['nuevo', 'viejo']);
  });

  it('devuelve como máximo 6 aunque haya más marcados', () => {
    const marcados = diez.map((t) => ({ ...t, data: { ...t.data, destacado: true } }));
    expect(seleccionarDestacados(marcados)).toHaveLength(6);
  });

  it('devuelve una lista vacía si no hay trabajos', () => {
    expect(seleccionarDestacados([])).toEqual([]);
  });
});

describe('seleccionarRelacionados', () => {
  it('devuelve los 3 más recientes de la misma categoría, sin el actual', () => {
    const actual = trabajo('actual', '2026-04-01', { categoria: 'placas' });
    const lista = [
      actual,
      trabajo('p1', '2026-01-01', { categoria: 'placas' }),
      trabajo('p2', '2026-02-01', { categoria: 'placas' }),
      trabajo('p3', '2026-03-01', { categoria: 'placas' }),
      trabajo('p4', '2026-05-01', { categoria: 'placas' }),
      trabajo('p5', '2026-06-01', { categoria: 'placas' }),
      trabajo('otra', '2026-07-01', { categoria: 'marcos' }),
    ];
    expect(ids(seleccionarRelacionados(lista, actual))).toEqual(['p5', 'p4', 'p3']);
  });

  it('devuelve una lista vacía si no hay otros de la categoría', () => {
    const actual = trabajo('actual', '2026-04-01', { categoria: 'placas' });
    const lista = [actual, trabajo('otra', '2026-07-01', { categoria: 'marcos' })];
    expect(seleccionarRelacionados(lista, actual)).toEqual([]);
  });
});

describe('categoriasConTrabajos', () => {
  it('conserva el orden de las categorías y quita las que no tienen trabajos', () => {
    const categorias = [{ id: 'llaveros' }, { id: 'placas' }, { id: 'marcos' }];
    const lista = [
      trabajo('a', '2026-01-01', { categoria: 'marcos' }),
      trabajo('b', '2026-02-01', { categoria: 'llaveros' }),
    ];
    expect(categoriasConTrabajos(categorias, lista)).toEqual([{ id: 'llaveros' }, { id: 'marcos' }]);
  });
});
