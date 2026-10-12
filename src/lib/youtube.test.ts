import { describe, expect, it } from 'vitest';
import { parseYouTube } from './youtube';

const ID = 'dQw4w9WgXcQ';

describe('parseYouTube', () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&t=30s`,
    `https://m.youtube.com/watch?feature=share&v=${ID}`,
    `youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=abc123&t=12`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}?rel=0`,
    ID,
    `  ${ID}  `,
  ])('reconoce %s como video horizontal', (entrada) => {
    expect(parseYouTube(entrada)).toEqual({ id: ID, vertical: false });
  });

  it.each([
    'https://www.youtube.com/shorts/AbC123xyz_0',
    'https://youtube.com/shorts/AbC123xyz_0?feature=share',
  ])('marca %s como vertical', (entrada) => {
    expect(parseYouTube(entrada)).toEqual({ id: 'AbC123xyz_0', vertical: true });
  });

  it.each([
    'https://vimeo.com/12345',
    `https://vimeo.com/${ID}`,
    `https://example.com/watch?v=${ID}`,
    'https://www.youtube.com/watch?v=corto',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQextra',
    'https://www.youtube.com/@cublasercreative',
    'https://youtu.be/',
    'dQw4w9WgXc',
    'dQw4w9WgXc!',
    '',
    'no es un enlace',
  ])('rechaza %s', (entrada) => {
    expect(parseYouTube(entrada)).toBeNull();
  });
});
