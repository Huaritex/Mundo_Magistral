import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

// Presupuestos de apps/site (Vite + React SSG).
const dist = new URL('../apps/site/dist/', import.meta.url).pathname;
if (!existsSync(dist)) throw new Error('Falta apps/site/dist: ejecutar pnpm build primero.');

const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else files.push({ path, name: relative(dist, path), bytes: statSync(path).size });
  }
}
walk(dist);

const failures = [];
function check(label, actual, limit) {
  console.log(`${label}: ${(actual / 1024).toFixed(1)} KiB / ${(limit / 1024).toFixed(1)} KiB`);
  if (actual > limit) failures.push(label);
}

const js = files.filter((file) => file.name.endsWith('.js'));
const gzip = (file) => gzipSync(readFileSync(file.path), { level: 9 }).byteLength;
// Chunks diferidos (solo cliente, tras idle): Stage*-<hash>.js del import lazy de StageCanvas, three-<hash>.js, detect-gpu-<hash>.js (ver vite.config.ts).
// React + R3F usa más JS que el plan original (90/200 KiB); límites 110/300 KiB aprobados por Cbass. Medido con gzip (COMPRESS=1) en 5 rutas.
const INITIAL_LIMIT = 110 * 1024;
const STAGE_LIMIT = 300 * 1024;
const deferredRe = /(^|\/)(Stage[A-Za-z0-9]*|three|detect-gpu)-[A-Za-z0-9_-]+[.]js$/;
const motionRe = /(^|\/)(motion|scroll)-[A-Za-z0-9_-]+[.]js$/;
const deferred = js.filter((file) => deferredRe.test(file.name));

// JS inicial real: <script src> + <link rel=modulepreload> de cada HTML generado (lo que el navegador baja antes de interactuar).
const htmlFiles = files.filter((file) => file.name.endsWith('.html'));
const byName = new Map(js.map((file) => [file.name, file]));
let worst = { page: '', bytes: 0 };
for (const page of htmlFiles) {
  const html = readFileSync(page.path, 'utf8');
  const refs = new Set();
  for (const tag of html.match(/<(?:script|link)\b[^>]*>/g) ?? []) {
    const isScript = /^<script\b[^>]*\btype="module"/.test(tag);
    const isPreload = /^<link\b[^>]*\brel="modulepreload"/.test(tag);
    if (!isScript && !isPreload) continue;
    const src = /\b(?:src|href)="([^"]+)"/.exec(tag)?.[1];
    if (src?.endsWith('.js')) refs.add(src.replace(/^\//, ''));
  }
  const initial = [...refs].map((name) => byName.get(name)).filter(Boolean);
  const leaked = initial.filter((file) => deferredRe.test(file.name));
  if (leaked.length) failures.push(`${page.name} carga chunks diferidos en el HTML inicial: ${leaked.map((file) => file.name).join(', ')}`);
  const bytes = initial.reduce((sum, file) => sum + gzip(file), 0);
  if (bytes > worst.bytes) worst = { page: page.name, bytes };
}
check(`JS inicial real (peor página: ${worst.page})`, worst.bytes, INITIAL_LIMIT);
check('Stage + three + detect-gpu', deferred.reduce((sum, file) => sum + gzip(file), 0), STAGE_LIMIT);
const motion = js.filter((file) => motionRe.test(file.name));
check('Motion + scroll', motion.reduce((sum, file) => sum + gzip(file), 0), 60 * 1024);

const poster = files.find((file) => file.name === 'media/poster-hero.avif');
if (!poster) failures.push('falta media/poster-hero.avif');
else check('Póster hero móvil', poster.bytes, 60 * 1024);

for (const file of files.filter((item) => item.name.startsWith('media/formas/') && /\.(avif|webp|png|jpe?g)$/i.test(item.name))) {
  check(`Banner ${file.name}`, file.bytes, 80 * 1024);
}
const glb = files.filter((file) => /\.(glb|ktx2)$/i.test(file.name));
check('GLB y texturas KTX2', glb.reduce((sum, file) => sum + file.bytes, 0), 600 * 1024);
for (const file of files.filter((item) => /hero.*\.(mp4|webm|av1)$/i.test(item.name))) {
  check(`Video ${file.name}`, file.bytes, Math.floor(1.2 * 1024 * 1024));
}

if (failures.length) throw new Error(`Presupuestos incumplidos: ${failures.join(', ')}`);
