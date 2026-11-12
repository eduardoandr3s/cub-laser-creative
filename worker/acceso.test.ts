import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { comprobarOrigen, correoDeLaSesion } from './acceso';

const EQUIPO = 'https://cub-pruebas.cloudflareaccess.com';
const AUD = 'aud-del-panel';
const PRODUCCION = 'https://cublasercreative.es/admin/api/sesion';

const env = (cambios: Partial<Env> = {}) =>
  ({ ACCESS_EQUIPO: EQUIPO, ACCESS_AUD: AUD, GITHUB_REPO: 'yo/repo', GITHUB_RAMA: 'main', ...cambios }) as Env;

let clavePrivada: CryptoKey;
let otraClave: CryptoKey;

beforeAll(async () => {
  const par = await generateKeyPair('RS256');
  clavePrivada = par.privateKey;
  otraClave = (await generateKeyPair('RS256')).privateKey;
  const publica = { ...(await exportJWK(par.publicKey)), kid: 'clave-1', alg: 'RS256', use: 'sig' };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (entrada: RequestInfo | URL) =>
      String(entrada) === `${EQUIPO}/cdn-cgi/access/certs`
        ? Response.json({ keys: [publica] })
        : new Response('no encontrado', { status: 404 }),
    ),
  );
});

afterAll(() => vi.unstubAllGlobals());

async function token({
  iss = EQUIPO,
  aud = AUD,
  caducidad = '1h',
  clave = clavePrivada,
}: { iss?: string; aud?: string; caducidad?: string | number; clave?: CryptoKey } = {}) {
  return new SignJWT({ email: 'editora@example.com' })
    .setProtectedHeader({ alg: 'RS256', kid: 'clave-1' })
    .setIssuer(iss)
    .setAudience(aud)
    .setIssuedAt()
    .setExpirationTime(caducidad)
    .sign(clave);
}

const peticion = (jwt?: string, url = PRODUCCION) =>
  new Request(url, { headers: jwt ? { 'Cf-Access-Jwt-Assertion': jwt } : {} });

describe('correoDeLaSesion', () => {
  it('devuelve el correo con un token válido', async () => {
    expect(await correoDeLaSesion(peticion(await token()), env())).toBe('editora@example.com');
  });

  it.each([
    ['sin token', async () => undefined],
    ['con otro aud', async () => token({ aud: 'otra-aplicacion' })],
    ['con otro iss', async () => token({ iss: 'https://otro.cloudflareaccess.com' })],
    ['caducado', async () => token({ caducidad: Math.floor(Date.now() / 1000) - 60 })],
    ['firmado con otra clave', async () => token({ clave: otraClave })],
    ['con basura', async () => 'esto.no.es-un-jwt'],
  ])('rechaza la petición %s', async (_caso, crear) => {
    expect(await correoDeLaSesion(peticion(await crear()), env())).toBeNull();
  });

  it('rechaza si falta la configuración de Access', async () => {
    expect(await correoDeLaSesion(peticion(await token()), env({ ACCESS_AUD: '' }))).toBeNull();
  });

  it('acepta el acceso local solo en localhost', async () => {
    const local = env({ ACCESO_LOCAL: '1' });
    expect(await correoDeLaSesion(peticion(undefined, 'http://localhost:8787/admin/api/sesion'), local)).toBe(
      'local@localhost',
    );
    expect(await correoDeLaSesion(peticion(undefined, PRODUCCION), local)).toBeNull();
    expect(
      await correoDeLaSesion(peticion(undefined, 'https://rama-cub-laser-creative.x.workers.dev/admin/api/sesion'), local),
    ).toBeNull();
  });
});

describe('comprobarOrigen', () => {
  const post = (cabeceras: Record<string, string>) =>
    new Request('https://cublasercreative.es/admin/api/guardar', { method: 'POST', headers: cabeceras });

  it('acepta las peticiones del propio panel', () => {
    expect(() => comprobarOrigen(post({ 'X-Panel': '1', Origin: 'https://cublasercreative.es' }))).not.toThrow();
  });

  it.each([
    [{ Origin: 'https://cublasercreative.es' }],
    [{ 'X-Panel': '1', Origin: 'https://otra-web.example' }],
    [{ 'X-Panel': '1' }],
  ])('rechaza %j', (cabeceras) => {
    expect(() => comprobarOrigen(post(cabeceras))).toThrow(/no viene del panel/);
  });
});
