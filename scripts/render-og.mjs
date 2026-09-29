import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sedes from '../apps/web/src/content/sedes.json' with { type: 'json' };
import especialidades from '../apps/web/src/content/especialidades.json' with { type: 'json' };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const video = join(root, 'apps/video');
const out = join(root, 'apps/web/public/media/og');
const remotion = join(video, 'node_modules/.bin/remotion');

const cards = [
  ['OgHome', 'home'], ['OgNosotros', 'nosotros'],
  ['OgEspecialidades', 'especialidades'], ['OgFormas', 'formas'],
  ['OgSucursales', 'sucursales'], ['OgCotizar', 'cotizar'],
  ['OgMedicos', 'medicos'], ['OgFaq', 'faq'],
  ...sedes.map(({ id }) => [`OgSede-${id}`, `sede-${id}`]),
  ...especialidades.map(({ id }) => [`OgEspecialidad-${id}`, `especialidad-${id}`]),
];

function run(command, args, cwd) {
  return new Promise((ok, fail) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });
    child.once('error', fail);
    child.once('close', (code) => code === 0 ? ok() : fail(new Error(`${command} terminó con código ${code}`)));
  });
}

const temp = await mkdtemp(join(tmpdir(), 'mm-og-'));
await mkdir(out, { recursive: true });
try {
  for (const [composition, name] of cards) {
    const png = join(temp, `${name}.png`);
    await run(remotion, ['still', 'src/index.ts', composition, png, '--log=error'], video);
    await run('magick', [png, '-strip', '-quality', '79', join(out, `${name}.webp`)], root);
    process.stdout.write(`OG ${name}.webp listo\n`);
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}
