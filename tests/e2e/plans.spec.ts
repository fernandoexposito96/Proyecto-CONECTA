import { test, expect } from './fixtures';

test('favorites stay synchronized between a plan card and its detail', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.plan-card').filter({ hasText: 'Noche de música' });
  await card.getByRole('button', { name: 'Noche de música', exact: true }).click();
  const detail = page.getByRole('dialog', { name: 'Detalle de Noche de música' });
  await detail.getByRole('button', { name: 'Añadir a favoritos', exact: true }).click();
  await detail.getByRole('button', { name: 'Cerrar detalle', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Quitar de favoritos', exact: true })).toBeVisible();
  await card.getByRole('button', { name: 'Quitar de favoritos', exact: true }).click();
  await card.getByRole('button', { name: 'Noche de música', exact: true }).press('Enter');
  await expect(detail.getByRole('button', { name: 'Añadir a favoritos', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('conecta-plan-favorites-v1') || '[]'))).toEqual([]);
});
