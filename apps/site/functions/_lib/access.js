// Cloudflare Access JWT verification without a runtime dependency.
function decodeBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('invalid_jwt');
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJson(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}

export async function verifyAccessJwt(request, env) {
  const team = env?.ACCESS_TEAM_DOMAIN;
  const audience = env?.ACCESS_AUD;
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!team || !audience || !token || token.length > 16_384) return false;

  let issuer;
  try {
    issuer = new URL(team);
  } catch {
    return false;
  }
  if (issuer.protocol !== 'https:' || issuer.username || issuer.password || issuer.port ||
      issuer.pathname !== '/' || issuer.search || issuer.hash ||
      !/^[a-z0-9-]+\.cloudflareaccess\.com$/i.test(issuer.hostname)) return false;
  const expectedIssuer = issuer.origin;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const header = decodeJson(parts[0]);
    const claims = decodeJson(parts[1]);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid ||
        claims.iss !== expectedIssuer || claims.type !== 'app' ||
        !(Array.isArray(claims.aud) ? claims.aud.includes(audience) : claims.aud === audience)) return false;

    const now = Math.floor(Date.now() / 1000);
    if (!Number.isInteger(claims.exp) || claims.exp <= now ||
        !Number.isInteger(claims.nbf) || claims.nbf > now + 30 ||
        !Number.isInteger(claims.iat) || claims.iat > now + 30) return false;

    const response = await fetch(`${expectedIssuer}/cdn-cgi/access/certs`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const jwks = await response.json();
    const jwk = jwks?.keys?.find((key) => key.kid === header.kid && key.kty === 'RSA');
    if (!jwk) return false;
    const publicKey = await crypto.subtle.importKey('jwk', jwk, {
      name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256',
    }, false, ['verify']);
    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', publicKey, decodeBase64Url(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
  } catch {
    return false;
  }
}
