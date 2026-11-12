import { describe, expect, it } from 'vitest';
import { parseInstagram } from './instagram';

const CODIGO = 'C8fFxCVOTvz';

describe('parseInstagram', () => {
  it.each([
    `https://www.instagram.com/p/${CODIGO}/`,
    `https://instagram.com/p/${CODIGO}`,
    `https://m.instagram.com/p/${CODIGO}/?igsh=MWQ1ZGUxMzBkMA==`,
    `instagram.com/p/${CODIGO}/`,
    `https://www.instagram.com/tv/${CODIGO}/`,
    `https://www.instagram.com/cublasercreative/p/${CODIGO}/`,
    `https://instagr.am/p/${CODIGO}/`,
    `  https://www.instagram.com/p/${CODIGO}/  `,
  ])('reconoce %s como publicación', (entrada) => {
    expect(parseInstagram(entrada)).toEqual({
      codigo: CODIGO,
      tipo: 'p',
      url: `https://www.instagram.com/p/${CODIGO}/`,
    });
  });

  it.each([
    `https://www.instagram.com/reel/${CODIGO}/`,
    `https://www.instagram.com/reels/${CODIGO}/?utm_source=ig_web_copy_link`,
    `https://www.instagram.com/cublasercreative/reel/${CODIGO}/`,
  ])('reconoce %s como reel', (entrada) => {
    expect(parseInstagram(entrada)).toEqual({
      codigo: CODIGO,
      tipo: 'reel',
      url: `https://www.instagram.com/reel/${CODIGO}/`,
    });
  });

  it.each([
    'https://www.instagram.com/cublasercreative/',
    'https://www.instagram.com/',
    'https://www.instagram.com/stories/cublasercreative/3141592653589793238/',
    'https://www.instagram.com/explore/tags/laser/',
    `https://www.instagram.com/p/${CODIGO}/extra/de/mas/`,
    'https://www.instagram.com/p/abc/',
    'https://www.instagram.com/p/con espacio/',
    `https://www.instagram.com.evil.example/p/${CODIGO}/`,
    `https://www.facebook.com/p/${CODIGO}/`,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    CODIGO,
    '',
    'no es un enlace',
  ])('rechaza %s', (entrada) => {
    expect(parseInstagram(entrada)).toBeNull();
  });
});
