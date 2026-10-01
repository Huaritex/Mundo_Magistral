export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_REQUEST_BYTES = MAX_FILE_BYTES + 32 * 1024;

export const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'Strict-Transport-Security': 'max-age=31536000',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export function json(status, error, message, extra = {}) {
  return new Response(JSON.stringify(error ? { error, message } : extra), {
    status,
    headers: { ...RESPONSE_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  return origin !== null && origin === new URL(request.url).origin;
}

export async function boundedFormData(request) {
  const length = request.headers.get('Content-Length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_REQUEST_BYTES)) {
    throw new RangeError('body_too_large');
  }
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('multipart/form-data;')) {
    throw new TypeError('invalid_content_type');
  }
  if (!request.body) throw new TypeError('missing_body');

  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new RangeError('body_too_large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return await new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': request.headers.get('Content-Type') },
      body: bytes,
    }).formData();
  } catch {
    throw new TypeError('invalid_multipart');
  }
}

export function sniffFile(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: 'image/jpeg', extension: 'jpg' };
  }
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)) {
    return { mime: 'image/png', extension: 'png' };
  }
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') {
    return { mime: 'image/webp', extension: 'webp' };
  }
  if (bytes.length >= 5 && ascii(bytes, 0, 5) === '%PDF-') {
    return { mime: 'application/pdf', extension: 'pdf' };
  }
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === 'ftyp') {
    const brands = [];
    for (let offset = 8; offset + 4 <= Math.min(bytes.length, 64); offset += 4) {
      brands.push(ascii(bytes, offset, offset + 4));
    }
    if (brands.some((brand) => ['heic', 'heix', 'hevc', 'hevx'].includes(brand))) {
      return { mime: 'image/heic', extension: 'heic' };
    }
  }
  return null;
}

function ascii(bytes, start, end) {
  return String.fromCharCode(...bytes.subarray(start, end));
}

export function validText(form, key, max, optional = false) {
  const values = form.getAll(key);
  if (values.length === 0 && optional) return '';
  if (values.length !== 1 || typeof values[0] !== 'string') return null;
  const value = values[0].trim();
  if ((!optional && !value) || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) return null;
  return value;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

export function validId(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
