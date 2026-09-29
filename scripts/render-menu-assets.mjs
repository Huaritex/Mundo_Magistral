import { spawn } from 'node:child_process';
import { copyFile, mkdtemp, mkdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const video = join(root, 'apps/video');
const publicMedia = join(root, 'apps/web/public/media');
const remotion = join(video, 'node_modules/.bin/remotion');
const budgets = {
  'menu-backdrop.mp4': 350_000,
  'menu-backdrop-av1.mp4': 200_000,
  'menu-backdrop-poster.avif': 30_000,
};
const posterFrame = 60;

function run(command, args, cwd) {
  return new Promise((ok, fail) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });
    child.once('error', fail);
    child.once('close', (code) => code === 0 ? ok() : fail(new Error(`${command} terminó con código ${code}`)));
  });
}

const temp = await mkdtemp(join(tmpdir(), 'mm-menu-'));
try {
  const h264 = join(temp, 'menu-backdrop.mp4');
  const av1 = join(temp, 'menu-backdrop-av1.mp4');
  const png = join(temp, 'poster.png');
  const poster = join(temp, 'menu-backdrop-poster.avif');

  // Intermedio casi sin pérdida; los finales se codifican desde él (Remotion emite yuvj420p, se fuerza rango TV).
  const master = join(temp, 'master.mp4');
  await run(remotion, ['render', 'src/index.ts', 'MenuBackdrop', master,
    '--codec=h264', '--crf=10', '--muted', '--log=error'], video);
  const tv = 'scale=out_range=tv:flags=accurate_rnd,format=yuv420p';
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', master, '-an', '-vf', tv,
    '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '26', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', h264], root);
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', master, '-an', '-vf', tv,
    '-c:v', 'libsvtav1', '-preset', '6', '-crf', '40', '-svtav1-params', 'film-grain=0',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', av1], root);
  await run(remotion, ['still', 'src/index.ts', 'MenuBackdrop', png, `--frame=${posterFrame}`, '--log=error'], video);
  await run('magick', [png, '-quality', '40', poster], root);

  for (const [name, max] of Object.entries(budgets)) {
    const { size } = await stat(join(temp, name));
    if (size > max) throw new Error(`${name} supera el presupuesto (${size} B > ${max} B)`);
  }

  await mkdir(publicMedia, { recursive: true });
  for (const name of Object.keys(budgets)) {
    await copyFile(join(temp, name), join(publicMedia, name));
    process.stdout.write(`Medio listo: ${name}\n`);
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}
