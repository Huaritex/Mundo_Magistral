import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = ['/', '/nosotros', '/formas-farmaceuticas', '/sucursales/la-paz', '/cotizar'];

test('contenido y CTA disponibles en las páginas principales', async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.locator('header a[href="/cotizar"]').first()).toBeVisible();
  }
});

test('el mismo canvas persiste tras tres navegaciones del cliente', async ({ page }) => {
  await page.goto('/?tier=2');
  await page.waitForFunction(() => Boolean(window.__mmStageRuntime?.stage), null, { timeout: 15_000 });
  await page.evaluate(() => {
    window.__testCanvas = window.__mmStageRuntime.stage.canvas;
    window.__testContext = window.__mmStageRuntime.stage.renderer.getContext();
  });
  for (const path of ['/nosotros', '/especialidades', '/formas-farmaceuticas']) {
    await page.locator(`header a[href="${path}"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    const persists = await page.evaluate(() => {
      const canvas = document.getElementById('stage');
      const stage = window.__mmStageRuntime?.stage;
      return stage && canvas === window.__testCanvas && stage.renderer.getContext() === window.__testContext;
    });
    expect(persists).toBe(true);
  }
});

test('el Stage sigue dibujando durante la navegación', async ({ page }) => {
  await page.goto('/?tier=2');
  await page.waitForFunction(() => Boolean(window.__mmStageRuntime?.stage), null, { timeout: 15_000 });
  await page.evaluate(() => {
    window.__frameHashes = [];
    window.__frameSampler = setInterval(() => {
      window.__frameHashes.push(window.__mmStageRuntime.stage.renderer.info.render.frame);
    }, 75);
  });
  await page.locator('header a[href="/nosotros"]').first().click();
  await expect(page).toHaveURL(/\/nosotros$/);
  await page.waitForTimeout(450);
  const frames = await page.evaluate(() => {
    clearInterval(window.__frameSampler);
    return window.__frameHashes;
  });
  expect(frames.length).toBeGreaterThanOrEqual(3);
  expect(new Set(frames).size).toBeGreaterThanOrEqual(3);
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
