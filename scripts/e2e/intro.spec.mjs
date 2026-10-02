import { test, expect } from '@playwright/test';

test('intro fullscreen, portada montada, cierre continuo y una vez por sesión', async ({ page }) => {
  await page.goto('/?tier=1&rm=0');
  const overlay = page.locator('.intro-overlay');
  await expect(overlay).toBeVisible();
  await expect(page.locator('main .home-hero')).toBeAttached();
  const dimensions = await overlay.boundingBox();
  const viewport = page.viewportSize();
  expect(dimensions.x).toBe(0);
  expect(dimensions.y).toBe(0);
  expect(dimensions.width).toBe(viewport.width);
  expect(dimensions.height).toBe(viewport.height);
  await expect(page.locator('main')).toHaveJSProperty('inert', true);
  await expect(page.locator('main .hero-dots button').first()).toHaveAttribute('aria-current', 'true');
  await expect(overlay).toHaveCount(0, { timeout: 5_000 });
  expect(await page.evaluate(() => sessionStorage.getItem('mundo-magistral-intro-seen'))).toBe('1');
  await expect(page.locator('main')).toHaveJSProperty('inert', false);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await expect(page.locator('#site-header')).toHaveCSS('opacity', '1');
  await expect(page.locator('main .hero-actions a').first()).toBeVisible();
  await page.reload();
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(overlay).toHaveCount(0);
});

test('Saltar intro y Escape completan la salida y restauran el sitio', async ({ page }) => {
  for (const method of ['button', 'escape']) {
    await page.goto('/?tier=1&rm=0');
    await expect(page.locator('.intro-overlay')).toBeVisible();
    await expect(page.locator('main')).toHaveJSProperty('inert', true);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Saltar intro' })).toBeFocused();
    if (method === 'button') await page.getByRole('button', { name: 'Saltar intro' }).click();
    else await page.keyboard.press('Escape');
    await expect(page.locator('.intro-overlay')).toHaveCount(0, { timeout: 2_000 });
    expect(await page.evaluate(() => ({ seen: sessionStorage.getItem('mundo-magistral-intro-seen'), overflow: document.body.style.overflow, active: document.documentElement.dataset.mmIntroActive }))).toEqual({ seen: '1', overflow: '', active: undefined });
    await expect(page.locator('main')).toHaveJSProperty('inert', false);
    await page.evaluate(() => sessionStorage.removeItem('mundo-magistral-intro-seen'));
  }
});

test('movimiento reducido y entradas internas omiten la intro', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.locator('.intro-overlay')).toHaveCount(0);
  expect(await page.evaluate(() => sessionStorage.getItem('mundo-magistral-intro-seen'))).toBe('1');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => sessionStorage.removeItem('mundo-magistral-intro-seen'));
  await page.goto('/servicios');
  await page.locator('header .brand').click();
  await expect(page.locator('main .home-hero')).toBeVisible();
  await expect(page.locator('.intro-overlay')).toHaveCount(0);
});

test('una imagen fallida libera la portada y no deja el scroll bloqueado', async ({ page }) => {
  await page.route('**/media/intro/*.webp', (route) => route.abort());
  await page.goto('/?tier=1&rm=0');
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.locator('.intro-overlay')).toHaveCount(0, { timeout: 5_000 });
  await expect(page.locator('main')).toHaveJSProperty('inert', false);
  await expect(page.locator('#site-header')).toHaveCSS('opacity', '1');
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('el HTML está disponible aunque JavaScript esté desactivado', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL);
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.locator('.intro-overlay')).toBeHidden();
  await context.close();
});
