export function gone() {
  return new Response('<!doctype html><html lang="es"><meta charset="utf-8"><title>Contenido retirado | MundoMagistral</title><body><h1>Este contenido fue retirado.</h1><p>Visita <a href="/">MundoMagistral</a> para encontrar información actual.</p></body></html>', {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Content-Security-Policy': "default-src 'none'; style-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
