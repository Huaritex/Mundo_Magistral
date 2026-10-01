import {
  MAX_FILE_BYTES, RESPONSE_HEADERS, boundedFormData, json, sameOrigin, sniffFile, validText,
} from '../_lib/receta.js';

const SEDES = new Set([
  'santa-cruz-central', 'santa-cruz-sur', 'la-paz', 'sucre',
  'trinidad', 'oruro', 'cochabamba', 'tarija',
]);
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json(403, 'forbidden_origin', 'Solicitud desde un origen no permitido.');
  const retentionDays = Number(env?.RECETAS_RETENTION_DAYS);
  if (env?.RECETA_UPLOAD_ENABLED !== 'true' || !env?.RECETAS_BUCKET?.put || !env?.TURNSTILE_SECRET ||
      !Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 365) {
    return json(503, 'service_unavailable', 'La recepción de archivos no está disponible.');
  }

  const ip = request.headers.get('CF-Connecting-IP');
  if (env.RECETA_RATE_LIMITER && ip) {
    try {
      const result = await env.RECETA_RATE_LIMITER.limit({ key: ip });
      if (!result.success) {
        const response = json(429, 'rate_limited', 'Demasiados intentos. Probá de nuevo más tarde.');
        response.headers.set('Retry-After', '60');
        return response;
      }
    } catch {
      return json(503, 'service_unavailable', 'La recepción de archivos no está disponible.');
    }
  }

  let form;
  try {
    form = await boundedFormData(request);
  } catch (error) {
    if (error instanceof RangeError) return json(413, 'file_too_large', 'El archivo supera 10 MB.');
    return json(400, 'invalid_request', 'El formulario no es válido.');
  }

  const sede = validText(form, 'sede', 60);
  const nombre = validText(form, 'nombre', 120);
  const telefono = validText(form, 'telefono', 25);
  const observaciones = validText(form, 'observaciones', 2000, true);
  const consentimiento = validText(form, 'consentimiento', 5);
  const token = validText(form, 'cf-turnstile-response', 2048);
  const files = form.getAll('receta');
  if (!SEDES.has(sede) || !nombre || /[\r\n]/.test(nombre) || !telefono || !/^\+?[0-9][0-9\s().-]{6,23}$/.test(telefono) ||
      observaciones === null || consentimiento !== 'true' || !token ||
      files.length !== 1 || !(files[0] instanceof File)) {
    return json(400, 'invalid_request', 'Revisá los datos y el consentimiento del formulario.');
  }

  const file = files[0];
  if (!file.size) return json(415, 'unsupported_file', 'El archivo está vacío.');
  if (file.size > MAX_FILE_BYTES) {
    return json(413, 'file_too_large', 'El archivo debe pesar 10 MB o menos.');
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = sniffFile(bytes);
  const declared = file.type.toLowerCase();
  const heicDeclared = detected?.mime === 'image/heic' && ['image/heic', 'image/heif'].includes(declared);
  if (!detected || (declared && declared !== 'application/octet-stream' &&
      declared !== detected.mime && !heicDeclared)) {
    return json(415, 'unsupported_file', 'Subí un JPEG, PNG, WebP, HEIC o PDF válido.');
  }

  let verified;
  try {
    const payload = new FormData();
    payload.set('secret', env.TURNSTILE_SECRET);
    payload.set('response', token);
    if (ip) payload.set('remoteip', ip);
    const response = await fetch(SITEVERIFY, {
      method: 'POST', body: payload, signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('siteverify_unavailable');
    verified = await response.json();
  } catch {
    return json(503, 'service_unavailable', 'No se pudo verificar la solicitud.');
  }
  if (verified?.success !== true || verified.hostname !== new URL(request.url).hostname) {
    return json(403, 'verification_failed', 'La verificación venció o no fue válida.');
  }

  const id = crypto.randomUUID();
  const receivedAt = new Date();
  const expiresAt = new Date(receivedAt.getTime() + retentionDays * 86_400_000);
  const customMetadata = {
    id, sede, nombre, telefono, observaciones,
    recibido: receivedAt.toISOString(), vence: expiresAt.toISOString(), consentimiento: 'true',
  };
  if (new TextEncoder().encode(JSON.stringify(customMetadata)).byteLength > 5000) {
    return json(400, 'invalid_request', 'Las observaciones son demasiado largas.');
  }
  try {
    await env.RECETAS_BUCKET.put(`recetas/${id}`, bytes, {
      httpMetadata: { contentType: detected.mime },
      customMetadata,
    });
  } catch {
    return json(503, 'service_unavailable', 'No se pudo guardar la solicitud.');
  }
  return json(201, null, null, { id });
}

function methodNotAllowed() {
  return new Response(null, { status: 405, headers: { ...RESPONSE_HEADERS, Allow: 'POST' } });
}

export const onRequestGet = methodNotAllowed;
export const onRequestOptions = methodNotAllowed;
