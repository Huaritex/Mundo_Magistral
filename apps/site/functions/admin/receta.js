import { escapeHtml, RESPONSE_HEADERS, validId } from '../_lib/receta.js';
import { verifyAccessJwt } from '../_lib/access.js';

const EXTENSIONS = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/heic': 'heic', 'application/pdf': 'pdf',
};
const HTML_HEADERS = {
  ...RESPONSE_HEADERS,
  'Content-Type': 'text/html; charset=utf-8',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
};

function page(body, status = 200) {
  return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recetas · Mundo Magistral</title><style>body{font:1rem system-ui,sans-serif;color:#1e293b;max-width:42rem;margin:3rem auto;padding:0 1rem;line-height:1.6}a{color:#6f4897}input,button{font:inherit;padding:.6rem}input{width:min(100%,24rem)}button{background:#6f4897;color:white;border:0;cursor:pointer}dt{font-weight:700;margin-top:1rem}dd{margin:0;white-space:pre-wrap}</style></head><body><main><h1>Consulta de recetas</h1><form method="get" action="/admin/receta"><label for="id">Número de solicitud</label><br><input id="id" name="id" required pattern="[0-9a-fA-F-]{36}" autocomplete="off"><button type="submit">Consultar</button></form>${body}</main></body></html>`, {
    status, headers: HTML_HEADERS,
  });
}

export async function onRequestGet({ request, env }) {
  if (!env?.RECETAS_BUCKET?.get || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
    return page('<p>El panel no está configurado.</p>', 503);
  }
  if (!await verifyAccessJwt(request, env)) return page('<p>Acceso denegado.</p>', 403);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (id === null) return page('<p>Introducí el número compartido por el paciente en WhatsApp.</p>');
  if (!validId(id)) return page('<p>Número de solicitud no válido.</p>', 400);

  let object;
  try {
    object = await env.RECETAS_BUCKET.get(`recetas/${id}`);
  } catch {
    return page('<p>No se pudo consultar la solicitud. Probá de nuevo.</p>', 503);
  }
  if (!object) return page('<p>Solicitud no encontrada o ya eliminada por retención.</p>', 404);

  const meta = object.customMetadata || {};
  const expiresAt = Date.parse(meta.vence);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return page('<p>Solicitud no encontrada o ya eliminada por retención.</p>', 404);
  }

  const mime = object.httpMetadata?.contentType;
  if (!EXTENSIONS[mime]) return page('<p>El tipo de archivo almacenado no es válido.</p>', 503);
  if (url.searchParams.get('download') === '1') {
    return new Response(object.body, {
      status: 200,
      headers: {
        ...RESPONSE_HEADERS,
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="receta-${id}.${EXTENSIONS[mime]}"`,
      },
    });
  }

  const rows = [
    ['Sede', meta.sede], ['Nombre', meta.nombre], ['WhatsApp', meta.telefono],
    ['Observaciones', meta.observaciones], ['Recibido', meta.recibido],
  ].map(([label, value]) => `<dt>${label}</dt><dd>${escapeHtml(value || '—')}</dd>`).join('');
  return page(`<h2>Solicitud ${escapeHtml(id)}</h2><dl>${rows}</dl><p><a href="/admin/receta?id=${encodeURIComponent(id)}&amp;download=1">Descargar receta</a></p>`);
}
