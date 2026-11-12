import type { APIRoute } from 'astro';

/**
 * Commit de la versión publicada. El panel de edición lo consulta después de guardar para
 * saber cuándo la web ya incluye el cambio. Workers Builds define WORKERS_CI_COMMIT_SHA;
 * en un build local queda en `null`.
 */
export const GET: APIRoute = () =>
  Response.json({ commit: process.env.WORKERS_CI_COMMIT_SHA || null });
