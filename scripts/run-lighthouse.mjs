import { spawn } from 'node:child_process';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'apps/web/dist');
const output = join(root, 'artifacts/lighthouse');
const cli = join(root, 'node_modules/.bin/lighthouse');
const paths = ['/', '/nosotros', '/formas-farmaceuticas', '/sucursales/la-paz', '/cotizar'];
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.avif': 'image/avif', '.mp4': 'video/mp4', '.vtt': 'text/vtt',
};

function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.once('error', reject);
    child.once('close', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} salió con ${code}`)));
  });
}

await mkdir(output, { recursive: true });
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let file = resolve(dist, `.${pathname}`);
    if (file !== dist && !file.startsWith(`${dist}${sep}`)) throw new Error('Ruta fuera de dist');
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
await new Promise((ok, fail) => {
  server.once('error', fail);
  server.listen(0, '127.0.0.1', ok);
});
const origin = `http://127.0.0.1:${server.address().port}`;
let failed = false;
try {
  for (const path of paths) {
    const name = path === '/' ? 'home' : path.replace(/^\//, '').replaceAll('/', '-');
    const reportPath = join(output, `${name}.json`);
    await run(cli, [
      `${origin}${path}`, '--quiet', '--output=json', `--output-path=${reportPath}`,
      '--only-categories=performance', '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage',
    ], { cwd: root, env: { ...process.env, CHROME_PATH: chromium.executablePath() } });
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    const score = report.categories.performance.score;
    const lcp = report.audits['largest-contentful-paint'].numericValue;
    const cls = report.audits['cumulative-layout-shift'].numericValue;
    const passed = score >= .9 && lcp <= 2500 && cls <= .05;
    process.stdout.write(`${passed ? '✓' : '✗'} ${path}: Performance ${Math.round(score * 100)}, LCP ${Math.round(lcp)} ms, CLS ${cls.toFixed(3)}\n`);
    failed ||= !passed;
  }
} finally {
  await new Promise((resolveClose) => server.close(resolveClose));
}
if (failed) process.exitCode = 1;
