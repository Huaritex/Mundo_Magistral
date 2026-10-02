import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const SITE = 'https://mundomagistral.bo';

/** Rutas HTML generadas → URLs (dirStyle flat: /nosotros → nosotros.html). Sin 404. */
function listRoutes(dir: string, root = dir): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'assets' || entry.name === 'media' ? [] : listRoutes(path, root);
    if (!entry.name.endsWith('.html')) return [];
    const route = '/' + relative(root, path).replace(/\.html$/, '');
    return route === '/404' ? [] : [route === '/index' ? '/' : route];
  });
}

/** Sitemap equivalente al de @astrojs/sitemap (sitemap-index.xml → sitemap-0.xml). */
function writeSitemap(dir: string) {
  const urls = listRoutes(dir).filter((route) => route !== '/nosotros').sort();
  const body = urls.map((route) => `<url><loc>${SITE}${route}</loc></url>`).join('');
  writeFileSync(join(dir, 'sitemap-0.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
  writeFileSync(join(dir, 'sitemap-index.xml'), `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${SITE}/sitemap-0.xml</loc></sitemap></sitemapindex>`);
}

/**
 * El SSG inyecta 2 <script> inline (estado de hidratación del router y hash del build) y el CSP de _headers
 * es `script-src 'self'` sin 'unsafe-inline'. Se calculan sus hashes SHA-256 sobre el HTML real y se añaden
 * al CSP de dist/_headers (public/_headers queda como plantilla). Falla el build si no puede parchear el CSP.
 */
function addInlineScriptHashes(dir: string) {
  const htmlFiles = listRoutes(dir).map((route) => join(dir, route === '/' ? 'index.html' : `${route}.html`));
  htmlFiles.push(join(dir, '404.html'));
  const hashes = new Set<string>();
  for (const file of htmlFiles) {
    for (const match of readFileSync(file, 'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      hashes.add(`'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
    }
  }
  const headersPath = join(dir, '_headers');
  const headers = readFileSync(headersPath, 'utf8');
  if (!headers.includes("script-src 'self'")) throw new Error("_headers: no se encontró script-src 'self' para añadir hashes");
  writeFileSync(headersPath, headers.replace("script-src 'self'", `script-src 'self' ${[...hashes].sort().join(' ')}`));
}

/**
 * Chunks con nombre estable para que scripts/check-budgets.mjs (SITE=site) los clasifique:
 *   three-*   three + r3f + drei (escena 3D, solo cliente/lazy)
 *   motion-*  gsap + lenis
 *   detect-gpu-*
 *   Stage-*   src/stage/** (chunk dinámico de StageCanvas; nombre por chunk automático)
 */
function manualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;
  // React va a su propio chunk inicial ANTES de los grupos diferidos: Rolldown arrastra al chunk manual las
  // dependencias de sus módulos (r3f → react), y three-* acabaría cargándose en el HTML inicial.
  if (/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(?:react|react-dom|scheduler)\//.test(id)) return 'react';
  if (/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?detect-gpu\//.test(id)) return 'detect-gpu';
  if (/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(?:three|@react-three|three-stdlib|three-mesh-bvh|meshline|camera-controls|@monogrid|maath|troika-[^/]+|@use-gesture|its-fine|suspend-react|zustand|stats-gl|tunnel-rat|react-use-measure|hls\.js|potpack|bidi-js)\//.test(id)) return 'three';
  // @gsap/react se deja FUERA a propósito: importa react y Rolldown arrastraba react/index.js al chunk motion, que
  // entonces entraba en el JS inicial de todas las páginas. Sin asignar, cae en el chunk gsap-* (≈0.5 KiB gz).
  if (/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(?:gsap|lenis)\//.test(id)) return 'motion';
  return undefined;
}

export default defineConfig({
  plugins: [react()],
  // Mismas variables PUBLIC_* que apps/web (Astro): PUBLIC_RECETA_UPLOAD_ENABLED, PUBLIC_TURNSTILE_SITE_KEY, PUBLIC_RECETAS_RETENTION_DAYS.
  envPrefix: ['VITE_', 'PUBLIC_'],
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks,
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  ssgOptions: {
    dirStyle: 'flat', // /nosotros → nosotros.html (Cloudflare Pages lo sirve en /nosotros sin barra final)
    script: 'async',
    // El SSG antepone ~1-3 KB de tags de Helmet (title, og, JSON-LD) al <head>: charset y viewport deben quedar
    // dentro de los primeros 1024 bytes (prescan del navegador), como en Base.astro.
    onPageRendered: (_route: string, html: string) => {
      const charset = /<meta charset="utf-8"\s*\/?>/i;
      const viewport = /<meta name="viewport"[^>]*>/i;
      const meta = `${charset.exec(html)?.[0] ?? '<meta charset="utf-8">'}${viewport.exec(html)?.[0] ?? ''}`;
      return html.replace(charset, '').replace(viewport, '').replace('<head>', `<head>${meta}`);
    },
    onFinished: (dir: string) => { writeSitemap(dir); addInlineScriptHashes(dir); },
  },
});
