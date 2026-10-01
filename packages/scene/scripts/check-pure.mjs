// Determinismo: la escena solo puede depender de sus props. Falla si src/ usa fuentes de tiempo/estado externo.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const banned = /\b(useFrame|clock|window|document|localStorage|gsap|ScrollTrigger|Date|performance\.now|requestAnimationFrame|Math\.random)\b/;
const root = new URL('../src/', import.meta.url).pathname;
let bad = 0;
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
  const path = join(dir, entry.name);
  if (entry.isDirectory()) return walk(path);
  const code = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  code.split('\n').forEach((line, i) => {
    if (banned.test(line)) { console.error(`${path}:${i + 1}: ${line.trim()}`); bad++; }
  });
});
walk(root);
if (bad) { console.error(`\n${bad} uso(s) prohibido(s) en @mm/scene`); process.exit(1); }
console.log('@mm/scene: puro (sin useFrame/clock/window/gsap/Date/random)');
