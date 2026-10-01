import { spawn } from 'node:child_process';
import { copyFile, mkdtemp, mkdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const video = join(root, 'apps/video');
const publicMedia = join(root, 'apps/site/public/media');
const remotion = join(video, 'node_modules/.bin/remotion');
const maxHeroBytes = 1_200_000;

function run(command, args, cwd) {
  return new Promise((ok, fail) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });
    child.once('error', fail);
    child.once('close', (code) => code === 0 ? ok() : fail(new Error(`${command} terminó con código ${code}`)));
  });
}

const temp = await mkdtemp(join(tmpdir(), 'mm-video-'));
try {
  const variants = [
    ['HeroBackdrop', 'hero-backdrop'],
    ['HeroBackdropVertical', 'hero-backdrop-vertical'],
  ];
  for (const [composition, basename] of variants) {
    const h264 = join(temp, `${basename}.mp4`);
    const av1 = join(temp, `${basename}-av1.mp4`);
    await run(remotion, ['render', 'src/index.ts', composition, h264,
      '--codec=h264', '--crf=31', '--x264-preset=slow', '--muted', '--log=error'], video);
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', h264,
      '-an', '-c:v', 'libsvtav1', '-preset', '10', '-crf', '48', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart', av1], root);
    for (const file of [h264, av1]) {
      const { size } = await stat(file);
      if (size > maxHeroBytes) throw new Error(`${file} supera el presupuesto hero (${size} B)`);
    }
  }

  const explainer = join(temp, 'explainer.mp4');
  await run(remotion, ['render', 'src/index.ts', 'Explainer', explainer,
    '--codec=h264', '--crf=30', '--x264-preset=slow', '--scale=0.5', '--muted', '--log=error'], video);

  await mkdir(publicMedia, { recursive: true });
  for (const name of [
    'hero-backdrop.mp4', 'hero-backdrop-av1.mp4',
    'hero-backdrop-vertical.mp4', 'hero-backdrop-vertical-av1.mp4',
    'explainer.mp4',
  ]) {
    await copyFile(join(temp, name), join(publicMedia, name));
    process.stdout.write(`Medio listo: ${name}\n`);
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}
