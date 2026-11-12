import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap-index.xml', site).href;
  // El panel de edición no se rastrea (además, está protegido y marcado `noindex`).
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
