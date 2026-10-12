import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { validarNegocio } from './negocio';

const datos = {
  nombre: 'CUB Laser Creative',
  eslogan: 'Corte y Grabado a Todo Color',
  descripcion: 'Corte láser e impresión a todo color sobre madera en Valencia.',
  url: 'https://cublasercreative.es',
  ubicacion: {
    localidad: 'Valencia',
    provincia: 'Valencia',
    pais: 'ES',
    zonaServicio: ['Valencia'],
  },
  whatsapp: { numero: '34600000000', mensajeGenerico: 'Hola' },
  legal: {
    titular: 'Nombre Apellido',
    nif: '12345678Z',
    domicilio: 'Calle Ejemplo 1, 46001 Valencia',
    email: 'hola@example.com',
  },
};

const conNumero = (numero: string) => ({ ...datos, whatsapp: { ...datos.whatsapp, numero } });

let aviso: MockInstance<typeof console.warn>;
beforeEach(() => {
  aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  aviso.mockRestore();
});

describe('validarNegocio', () => {
  it('acepta datos completos sin avisos', () => {
    const negocio = validarNegocio(datos, { prod: true });
    expect(negocio.whatsapp.numero).toBe('34600000000');
    expect(negocio.redes).toEqual({});
    expect(aviso).not.toHaveBeenCalled();
  });

  describe('en producción', () => {
    it.each(['', '+34 600 00 00 00', '034600000000', '3460000', '34600a00000'])(
      'falla con el número "%s" indicando el formato esperado',
      (numero) => {
        expect(() => validarNegocio(conNumero(numero), { prod: true })).toThrow(
          /Formato esperado: solo dígitos, con prefijo de país/,
        );
      },
    );
  });

  describe('en desarrollo', () => {
    it('solo avisa si el número no es válido', () => {
      expect(() => validarNegocio(conNumero('+34 600 00 00 00'), { prod: false })).not.toThrow();
      expect(aviso).toHaveBeenCalledWith(expect.stringContaining('Formato esperado'));
    });

    it('avisa si el número está vacío', () => {
      validarNegocio(conNumero(''), { prod: false });
      expect(aviso).toHaveBeenCalledOnce();
    });
  });

  it('avisa de los datos legales ausentes sin detener el build', () => {
    const sinNif = { ...datos, legal: { ...datos.legal, nif: undefined } };
    expect(() => validarNegocio(sinNif, { prod: true })).not.toThrow();
    expect(aviso).toHaveBeenCalledOnce();
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('Faltan datos legales'));
    expect(aviso.mock.calls[0]![0]).toMatch(/: NIF\./);
  });

  it('trata los datos legales vacíos como ausentes', () => {
    validarNegocio({ ...datos, legal: { ...datos.legal, domicilio: '  ', email: undefined } }, {
      prod: true,
    });
    expect(aviso.mock.calls[0]![0]).toMatch(/: domicilio, email\./);
  });

  it('falla si falta un dato obligatorio o la URL no es válida', () => {
    expect(() => validarNegocio({ ...datos, nombre: '' }, { prod: false })).toThrow(/nombre/);
    expect(() => validarNegocio({ ...datos, url: 'cublasercreative' }, { prod: false })).toThrow(
      /url/,
    );
  });
});
