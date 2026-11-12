import { describe, expect, it } from 'vitest';
import { medidasReducidas } from './fotos';

describe('medidasReducidas', () => {
  it('reduce una foto vertical del móvil a 2400 px de alto', () => {
    expect(medidasReducidas(3024, 4032)).toEqual({ ancho: 1800, alto: 2400 });
  });

  it('reduce una horizontal por su ancho', () => {
    expect(medidasReducidas(4032, 3024)).toEqual({ ancho: 2400, alto: 1800 });
  });

  it('no amplía las fotos pequeñas', () => {
    expect(medidasReducidas(800, 600)).toEqual({ ancho: 800, alto: 600 });
  });
});
