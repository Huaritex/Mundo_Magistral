import { spawn } from 'node:child_process';
import { mkdtemp, copyFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const video = join(root, 'apps/video');
const output = join(root, 'apps/site/public/media/poster-hero.avif');
const remotion = join(video, 'node_modules/.bin/remotion');

function run(command, args, cwd) {
  return new Promise((ok, fail) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });
    child.once('error', fail);
    child.once('close', (code) => code === 0 ? ok() : fail(new Error(`${command} terminó con código ${code}`)));
  });
}

const temp = await mkdtemp(join(tmpdir(), 'mm-hero-poster-'));
try {
  const png = join(temp, 'poster.png');
  const avif = join(temp, 'poster.avif');
  await run(remotion, ['still', 'src/index.ts', 'HeroPoster', png, '--log=error'], video);
  await run('magick', [png, '-strip', '-resize', '1080x486', '-quality', '45', avif], root);
  const { size } = await stat(avif);
  if (size > 60 * 1024) throw new Error(`Póster hero supera 60 KiB (${size} B)`);
  await copyFile(avif, output);
  process.stdout.write(`Póster hero listo: ${size} B\n`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
