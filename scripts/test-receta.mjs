import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../apps/site/functions/api/receta.js';
import { onRequestGet } from '../apps/site/functions/admin/receta.js';
import { boundedFormData, sniffFile } from '../apps/site/functions/_lib/receta.js';

const ORIGIN = 'https://mundomagistral.bo';
const PNG = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

function upload(overrides = {}) {
  const form = new FormData();
  form.set('sede', overrides.sede ?? 'la-paz');
  form.set('nombre', overrides.nombre ?? 'Paciente');
  form.set('telefono', overrides.telefono ?? '+591 71234567');
  form.set('observaciones', overrides.observaciones ?? 'Sin observaciones');
  form.set('consentimiento', overrides.consentimiento ?? 'true');
  form.set('cf-turnstile-response', overrides.token ?? 'test-token');
  form.set('receta', overrides.file ?? new File([PNG], 'receta.png', { type: 'image/png' }));
  return new Request(`${ORIGIN}/api/receta`, {
    method: 'POST', headers: { Origin: overrides.origin ?? ORIGIN }, body: form,
  });
}

test('detecta firmas reales y rechaza contenido ajeno', () => {
  assert.deepEqual(sniffFile(PNG), { mime: 'image/png', extension: 'png' });
  assert.deepEqual(sniffFile(new TextEncoder().encode('%PDF-1.7')), { mime: 'application/pdf', extension: 'pdf' });
  assert.equal(sniffFile(new TextEncoder().encode('....ftypmif1....avif')), null);
  assert.equal(sniffFile(new TextEncoder().encode('<script>')), null);
});

test('el límite del cuerpo se aplica durante el streaming', async () => {
  const request = new Request(`${ORIGIN}/api/receta`, {
    method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=x' },
    body: new Uint8Array(10 * 1024 * 1024 + 32 * 1024 + 1),
  });
  await assert.rejects(boundedFormData(request), RangeError);
});

test('subida completa: Turnstile, R2 privado y respuesta sin datos personales', async () => {
  const writes = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    return Response.json({ success: true, hostname: 'mundomagistral.bo' });
  };
  try {
    const response = await onRequestPost({
      request: upload(), env: {
        RECETA_UPLOAD_ENABLED: 'true',
        TURNSTILE_SECRET: 'test-secret',
        RECETAS_RETENTION_DAYS: '30',
        RECETAS_BUCKET: { put: async (...args) => writes.push(args) },
      },
    });
    assert.equal(response.status, 201);
    const data = await response.json();
    assert.match(data.id, /^[0-9a-f-]{36}$/);
    assert.deepEqual(Object.keys(data), ['id']);
    assert.equal(writes.length, 1);
    assert.equal(writes[0][0], `recetas/${data.id}`);
    assert.equal(writes[0][2].httpMetadata.contentType, 'image/png');
    assert.equal(writes[0][2].customMetadata.sede, 'la-paz');
    assert.ok(Date.parse(writes[0][2].customMetadata.vence) > Date.now());
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('falla cerrado sin configuración, origen propio o MIME real', async () => {
  const missing = await onRequestPost({ request: upload(), env: {} });
  assert.equal(missing.status, 503);
  assert.equal((await missing.json()).error, 'service_unavailable');

  const disabled = await onRequestPost({
    request: upload(), env: {
      TURNSTILE_SECRET: 'test-secret', RECETAS_RETENTION_DAYS: '30',
      RECETAS_BUCKET: { put: () => assert.fail('no debe guardar') },
    },
  });
  assert.equal(disabled.status, 503);

  const crossOrigin = await onRequestPost({
    request: upload({ origin: 'https://evil.example' }), env: {},
  });
  assert.equal(crossOrigin.status, 403);

  const invalidMime = await onRequestPost({
    request: upload({ file: new File(['not an image'], 'receta.png', { type: 'image/png' }) }),
    env: { RECETA_UPLOAD_ENABLED: 'true', TURNSTILE_SECRET: 'test-secret', RECETAS_RETENTION_DAYS: '30', RECETAS_BUCKET: { put: () => assert.fail('no debe guardar') } },
  });
  assert.equal(invalidMime.status, 415);
});

test('rechaza Turnstile inválido antes de guardar', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ success: false });
  try {
    const response = await onRequestPost({
      request: upload(),
      env: { RECETA_UPLOAD_ENABLED: 'true', TURNSTILE_SECRET: 'test-secret', RECETAS_RETENTION_DAYS: '30', RECETAS_BUCKET: { put: () => assert.fail('no debe guardar') } },
    });
    assert.equal(response.status, 403);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('el límite opcional por IP corta antes de leer la receta', async () => {
  const request = upload();
  request.headers.set('CF-Connecting-IP', '203.0.113.5');
  const response = await onRequestPost({
    request,
    env: {
      RECETA_UPLOAD_ENABLED: 'true',
      TURNSTILE_SECRET: 'test-secret', RECETAS_RETENTION_DAYS: '30',
      RECETAS_BUCKET: { put: () => assert.fail('no debe guardar') },
      RECETA_RATE_LIMITER: { limit: async ({ key }) => {
        assert.equal(key, '203.0.113.5');
        return { success: false };
      } },
    },
  });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '60');
});

test('panel: Access firmado, escape HTML y descarga privada', async () => {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: Uint8Array.from([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  const publicJwk = { ...await crypto.subtle.exportKey('jwk', pair.publicKey), kid: 'test-key' };
  const encoded = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${encoded({ alg: 'RS256', kid: 'test-key', typ: 'JWT' })}.${encoded({
    iss: 'https://team.cloudflareaccess.com', aud: ['aud-test'], type: 'app',
    exp: now + 300, iat: now, nbf: now,
  })}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${Buffer.from(signature).toString('base64url')}`;
  const id = crypto.randomUUID();
  let expires = new Date(Date.now() + 86_400_000).toISOString();
  const env = {
    ACCESS_TEAM_DOMAIN: 'https://team.cloudflareaccess.com', ACCESS_AUD: 'aud-test',
    RECETAS_BUCKET: { get: async () => ({
      body: new Blob([PNG]).stream(), httpMetadata: { contentType: 'image/png' },
      customMetadata: { nombre: '<script>alert(1)</script>', sede: 'la-paz', vence: expires },
    }) },
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ keys: [publicJwk] });
  try {
    const denied = await onRequestGet({ request: new Request(`${ORIGIN}/admin/receta?id=${id}`), env });
    assert.equal(denied.status, 403);
    const headers = { 'Cf-Access-Jwt-Assertion': jwt };
    const forged = `${unsigned.slice(0, unsigned.indexOf('.') + 1)}${encoded({
      iss: 'https://team.cloudflareaccess.com', aud: ['aud-test'], type: 'app',
      exp: now + 300, iat: now, nbf: now, email: 'intruso@example.com',
    })}.${Buffer.from(signature).toString('base64url')}`;
    const forgedResponse = await onRequestGet({
      request: new Request(`${ORIGIN}/admin/receta?id=${id}`, { headers: { 'Cf-Access-Jwt-Assertion': forged } }), env,
    });
    assert.equal(forgedResponse.status, 403);
    const page = await onRequestGet({ request: new Request(`${ORIGIN}/admin/receta?id=${id}`, { headers }), env });
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.doesNotMatch(html, /<script>alert/);
    const download = await onRequestGet({ request: new Request(`${ORIGIN}/admin/receta?id=${id}&download=1`, { headers }), env });
    assert.equal(download.headers.get('Content-Disposition'), `attachment; filename="receta-${id}.png"`);
    assert.deepEqual(new Uint8Array(await download.arrayBuffer()), PNG);
    expires = new Date(Date.now() - 1000).toISOString();
    const expired = await onRequestGet({ request: new Request(`${ORIGIN}/admin/receta?id=${id}&download=1`, { headers }), env });
    assert.equal(expired.status, 404);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
