import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures';

test('main demo routes render and navigation stays within viewport', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.home-target')).toBeVisible();
  const nav = page.locator(testInfo.project.name === 'desktop-chromium' ? '.sidebar nav' : '.bottom-nav');
  for (const [label, selector] of [['Inicio', '.home-target'], ['Explora', '.explore-page'], ['Chat', '.chat-page'], ['Perfil', '.profile-page']] as const) {
    await nav.getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator(selector)).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);

  }
  await page.getByRole('button', { name: 'Más opciones', exact: true }).click();
  await expect(page.locator('.settings-page')).toBeVisible();
  await page.getByRole('button', { name: /^Abrir notificaciones/ }).click();
  await expect(page.locator('.notifications-page')).toBeVisible();
  expect(errors).toEqual([]);
});


for (const [label, selector] of [['Inicio', '.home-target'], ['Explora', '.explore-page'], ['Chat', '.chat-page'], ['Perfil', '.profile-page']] as const) {
  test(`${label} images decode without fallbacks`, async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.locator('.home-target')).toBeVisible();
    const nav = page.locator(testInfo.project.name === 'desktop-chromium' ? '.sidebar nav' : '.bottom-nav');
    await nav.getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator(selector)).toBeVisible();
    await page.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
    await expect.poll(() => page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    await expect(page.locator('img[data-fallback-applied]')).toHaveCount(0);
    expect(await page.locator('img').evaluateAll(images => images.filter(image => image.complete && image.naturalWidth === 0).map(image => image.src))).toEqual([]);
    await testInfo.attach(`${label}-${testInfo.project.name}`, { body: await page.screenshot({ path: testInfo.outputPath(`${label}.png`), fullPage: true, animations: 'disabled' }), contentType: 'image/png' });
  });
}

test('home category opens the matching plans and profile editing persists', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.home-target')).toBeVisible();
  await page.locator('.home-target-categories').getByRole('button', { name: /^Café/ }).click();
  await expect(page.locator('.explore-page')).toBeVisible();
  await page.getByRole('button', { name: 'Abrir perfil', exact: true }).click();
  await page.getByRole('button', { name: 'Editar perfil', exact: true }).click();
  await page.getByRole('textbox', { name: 'Biografía' }).fill('Biografía de prueba aislada');
  await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
  await expect(page.locator('.profile-bio')).toHaveText('Biografía de prueba aislada');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('conecta-profile-bio-v1') || 'null'))).toBe('Biografía de prueba aislada');
});

test('home has no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.home-target')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => item.impact === 'serious' || item.impact === 'critical')).toEqual([]);
});
