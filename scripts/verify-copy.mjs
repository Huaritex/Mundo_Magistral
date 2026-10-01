import { readFileSync } from 'node:fs';

const verifiedCopy = JSON.parse(readFileSync(new URL('../apps/site/src/content/verified-copy.json', import.meta.url), 'utf8'));

const source = process.env.MM_WP_PAGES_URL ?? 'https://mundomagistral.bo/wp-json/wp/v2/pages?per_page=100';
const expectedPage = {
  welcome: 'home', what: 'home', history: 'quienes-somos',
  mission: 'quienes-somos', vision: 'quienes-somos', philosophy: 'quienes-somos',
};

function decodeHtml(value) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) => String.fromCodePoint(
      code[0].toLowerCase() === 'x' ? Number.parseInt(code.slice(1), 16) : Number.parseInt(code, 10),
    ))
    .replace(/&(nbsp|amp|quot|apos|lt|gt);/gi, (_, entity) => ({
      nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>',
    })[entity.toLowerCase()]);
}

function normalize(value) {
  return decodeHtml(value).normalize('NFKC').toLocaleLowerCase('es')
    .replace(/[\p{P}\p{S}]/gu, ' ').replace(/\s+/g, ' ').trim();
}

const response = await fetch(source, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15_000) });
if (!response.ok) throw new Error(`WP REST respondió ${response.status}; no se verificó el copy`);
const pages = await response.json();
if (!Array.isArray(pages)) throw new Error('La respuesta de WP REST no es una lista de páginas');
const bySlug = new Map(pages.map((page) => [page.slug, normalize(page.content?.rendered ?? '')]));
let missing = 0;
for (const [key, copy] of Object.entries(verifiedCopy)) {
  const slug = expectedPage[key];
  if (slug && bySlug.get(slug)?.includes(normalize(copy))) {
    process.stdout.write(`✓ ${key} (${slug})\n`);
  } else {
    process.stderr.write(`✗ ${key}: no coincide con la página ${slug ?? 'desconocida'} de WP REST\n`);
    missing++;
  }
}
if (missing) process.exitCode = 1;
