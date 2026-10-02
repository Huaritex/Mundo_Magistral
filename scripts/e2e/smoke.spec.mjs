import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// Los tests de Stage verifican la identidad del nodo <canvas id="stage" /> (sin tocar su contexto WebGL) y
// cuentan frames con window.__mmFrames (StageCanvas).

const pages = ['/', '/quienes-somos', '/equipo', '/servicios', '/noticias', '/contacto', '/formas-farmaceuticas', '/sucursales/la-paz', '/cotizar'];

// La presentación inicial tiene su propia suite; estas pruebas recorren el sitio ya disponible.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('mundo-magistral-intro-seen', '1'));
});

test('contenido y CTA disponibles en las páginas principales', async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.locator('header a[href="/cotizar"]').first()).toBeVisible();
  }
});

test('el hero muestra cinco tarjetas enlazadas sin control de pausa', async ({ page }) => {
  await page.goto('/?tier=1&rm=0');
  const hero = page.locator('.home-hero');
  const dots = hero.locator('.hero-dots button');
  await expect(dots).toHaveCount(5);
  await expect(dots.first()).toHaveAttribute('aria-current', 'true');
  await expect(hero.locator('.hero-play-toggle')).toHaveCount(0);
  await dots.nth(3).click();
  await expect(hero.locator('.hero-card-copy.is-active h2')).toContainText('Junto al profesional médico');
  await expect(hero.locator('.hero-photo.is-active')).toHaveAttribute('src', '/media/hero/acompanamiento.webp');
  await expect(hero.locator('.hero-card-copy.is-active')).toHaveAttribute('href', '/medicos');
  await dots.nth(4).click();
  await expect(hero.locator('.hero-card-copy.is-active h2')).toContainText('Atención en Bolivia');
  await hero.locator('.hero-card-copy.is-active').click();
  await expect(page).toHaveURL(/\/contacto$/);
});

test('el hero avanza cada 2,5 segundos, vuelve a la primera y respeta movimiento reducido', async ({ page }) => {
  await page.goto('/?tier=1&rm=0');
  await page.mouse.move(300, 300);
  await expect.poll(() => page.evaluate(() => document.querySelector('main .hero-progress > span').getAnimations()[0]?.effect?.getTiming().duration)).toBe(2500);
  await expect(page.locator('.hero-dots button').nth(1)).toHaveAttribute('aria-current', 'true', { timeout: 4_000 });
  await page.locator('.hero-dots button').nth(4).click();
  await expect(page.locator('.hero-dots button').first()).toHaveAttribute('aria-current', 'true', { timeout: 4_000 });
  await page.goto('/?tier=1&rm=1');
  await expect(page.locator('section.home-hero[data-chapter="hero"]')).toHaveAttribute('data-reduced', 'true');
  await expect(page.locator('.hero-progress')).toBeHidden();
  await expect(page.locator('.hero-dots button').first()).toHaveAttribute('aria-current', 'true');
  await page.locator('.hero-dots button').nth(4).click();
  await expect(page.locator('.hero-card-copy.is-active h2')).toContainText('Atención en Bolivia');
});

test('el mismo canvas persiste tras tres navegaciones del cliente', async ({ page }) => {
  await page.goto('/?tier=2');
  await page.waitForSelector('canvas#stage', { state: 'attached', timeout: 15_000 });
  // Solo identidad del nodo: NO llamar getContext() (crearía el contexto con atributos por defecto y competiría con three/R3F).
  await page.evaluate(() => { window.__testCanvas = document.getElementById('stage'); });
  for (const path of ['/quienes-somos', '/servicios', '/noticias']) {
    await page.locator(`header a[href="${path}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    const persists = await page.evaluate(() => {
      const canvas = document.getElementById('stage');
      return Boolean(canvas) && canvas === window.__testCanvas;
    });
    expect(persists).toBe(true);
  }
});

test('el Stage sigue dibujando durante la navegación', async ({ page }) => {
  await page.goto('/?tier=2');
  // window.__mmFrames incrementa en cada gl.render del Stage R3F.
  await page.waitForFunction(() => (window.__mmFrames ?? 0) > 0, null, { timeout: 20_000 });
  await page.evaluate(() => {
    window.__frameHashes = [];
    window.__frameSampler = setInterval(() => { window.__frameHashes.push(window.__mmFrames); }, 75);
  });
  await page.locator('header a[href="/quienes-somos"]').first().click();
  await expect(page).toHaveURL(/\/quienes-somos$/);
  await page.waitForTimeout(450);
  const frames = await page.evaluate(() => {
    clearInterval(window.__frameSampler);
    return window.__frameHashes;
  });
  expect(frames.length).toBeGreaterThanOrEqual(3);
  expect(new Set(frames).size).toBeGreaterThanOrEqual(3);
});

test('cada página interna entra con GSAP cuando el runtime está listo', async ({ page }) => {
  await page.goto('/?tier=1&rm=0');
  await page.waitForFunction(() => document.documentElement.dataset.gsapNavReady === '1', null, { timeout: 10_000 });
  for (const [path, title] of [
    ['/quienes-somos', 'Ciencia, precisión y cuidado en cada fórmula.'],
    ['/equipo', 'Personas detrás de cada preparación.'],
    ['/servicios', 'Soluciones magistrales adaptadas a cada necesidad.'],
    ['/noticias', 'Un espacio para seguir aprendiendo.'],
    ['/contacto', 'Estamos para ayudarte.'],
  ]) {
    await page.evaluate(() => {
      window.__heroMotionSamples = [];
      window.__heroMotionTimer = setInterval(() => {
        const media = document.querySelector('.internal-hero-media');
        if (media) window.__heroMotionSamples.push({ path: location.pathname, opacity: Number(getComputedStyle(media).opacity) });
      }, 16);
    });
    await page.locator(`header a[href="${path}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.locator('.internal-hero h1')).toHaveText(title);
    await page.waitForTimeout(700);
    const state = await page.evaluate(() => {
      clearInterval(window.__heroMotionTimer);
      return {
        samples: window.__heroMotionSamples,
        opacity: getComputedStyle(document.querySelector('.internal-hero-media')).opacity,
        transform: getComputedStyle(document.querySelector('.internal-hero-media')).transform,
      };
    });
    expect(state.samples.some((sample) => sample.path === path && sample.opacity < .8), `animación de ${path}`).toBe(true);
    expect(state.opacity).toBe('1');
    expect(state.transform).toBe('none');
  }
});

test('movimiento reducido deja visibles los heroes internos', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?rm=1');
  await page.locator('header a[href="/servicios"]').first().click();
  await expect(page.locator('.internal-hero h1')).toHaveText('Soluciones magistrales adaptadas a cada necesidad.');
  await expect(page.locator('.internal-hero-media')).toHaveCSS('opacity', '1');
  await expect(page.locator('.internal-hero-media')).toHaveCSS('transform', 'none');
});

test('a 360 px cotizar y WhatsApp siguen a un tap durante el scroll', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await expect(page.locator('header a[href="/cotizar"]')).toBeInViewport();
  await expect(page.locator('.floating-wa')).toBeInViewport();
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await expect(page.locator('#menu-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu-dialog')).toBeHidden();
});

test('fallbacks mantienen contenido y guardan capturas para revisión visual', async ({ page }, testInfo) => {
  for (const query of ['?tier=1', '?rm=1']) {
    await page.goto(`/${query}`);
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.locator('header a[href="/cotizar"]').first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`home-${query.slice(1).replace('=', '-')}.png`), fullPage: true });
  }
});

test('tier 1 reproduce el fondo de respaldo y respeta movimiento reducido', async ({ page }) => {
  await page.goto('/?tier=1&rm=0');
  const video = page.locator('.stage-loop');
  await expect(video).toBeVisible();
  await page.waitForFunction(() => {
    const loop = document.querySelector('.stage-loop');
    return loop instanceof HTMLVideoElement && !loop.paused && loop.currentTime > .1;
  }, null, { timeout: 10_000 });
  await page.goto('/?rm=1');
  await expect(video).toBeHidden();
});

test('cotización entrega ID o guía al paciente a adjuntar en WhatsApp', async ({ page }) => {
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: "const ready=()=>{const widget=document.querySelector('.cf-turnstile');if(widget){const input=document.createElement('input');input.type='hidden';input.name='cf-turnstile-response';input.value='E2E_TOKEN';widget.append(input)}};if(document.readyState==='loading')addEventListener('DOMContentLoaded',ready);else ready();",
  }));
  await page.goto('/cotizar?sede=la-paz');
  const turnstileEnabled = await page.locator('#quote-shell').getAttribute('data-turnstile') === 'enabled';
  await expect(page.locator('#sede')).toHaveValue('la-paz');
  await page.locator('[data-next="2"]').click();
  await page.locator('#nombre').fill('Paciente de prueba');
  await page.locator('#telefono').fill('+591 71234567');
  await page.locator('#receta-file').setInputFiles({
    name: 'receta.png', mimeType: 'image/png',
    buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]),
  });
  await page.locator('[data-next="3"]').click();
  await expect(page.locator('#quote-summary')).toContainText('Paciente de prueba');
  if (turnstileEnabled) {
    const id = 'bda18887-b7ca-48c6-b225-ab774598a966';
    await page.route('**/api/receta', async (route) => {
      expect(route.request().postData()).toContain('Paciente de prueba');
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id }) });
    });
    await page.locator('#consentimiento').check();
    await expect(page.locator('[name="cf-turnstile-response"]')).not.toHaveValue('', { timeout: 15_000 });
    await page.getByRole('button', { name: 'Enviar receta' }).click();
    await expect(page.locator('#quote-success')).toBeVisible();
    await expect(page.locator('#quote-id')).toHaveText(id);
    await expect(page.locator('#quote-whatsapp')).toHaveAttribute('href', new RegExp(id));
  } else {
    await expect(page.locator('#fallback-submit')).toHaveAttribute('href', /wa\.me\/59172151553.*La%20adjuntar/);
    await expect(page.locator('.fallback-note')).toContainText('no adjunta archivos automáticamente');
  }
});

test('sin violaciones axe WCAG A/AA ni de impacto serio o crítico', async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    const result = await new AxeBuilder({ page }).analyze();
    const important = result.violations.filter((violation) =>
      violation.tags.some((tag) => /^wcag(?:2|21|22)(?:a|aa)$/.test(tag)) ||
      ['serious', 'critical'].includes(violation.impact));
    expect(important, `axe en ${path}: ${important.map((v) => `${v.id} (${v.nodes.length})`).join(', ')}`).toEqual([]);
  }
});

test('capturas finales de las rutas principales a 1440 y 360 px', async ({ page }) => {
  test.setTimeout(180_000);
  const output = resolve('artifacts/design-shots/final');
  await mkdir(output, { recursive: true });
  for (const width of [1440, 360]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of pages) {
      await page.goto(`${path}${path.includes('?') ? '&' : '?'}tier=1`);
      await expect(page.locator('main h1').first()).toBeVisible();
      const name = path === '/' ? 'home' : path.slice(1).replaceAll('/', '-');
      await page.screenshot({ path: resolve(output, `${name}-${width}.png`), fullPage: true, animations: 'disabled' });
    }
  }
  await page.goto('/?tier=1');
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await expect(page.locator('#menu-dialog')).toBeVisible();
  await expect(page.locator('#menu-dialog nav a').first()).toBeInViewport();
  await page.waitForTimeout(900);
  await page.screenshot({ path: resolve(output, 'menu-360.png'), animations: 'disabled' });
});
