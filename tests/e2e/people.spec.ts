import { test, expect } from './fixtures';

test('blocking a demo person removes them from Explore, Home and Chat', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar planes', exact: true }).click();
  await page.locator('.discover-person-card').filter({ hasText: 'Marta' }).click();
  await page.getByRole('button', { name: 'Ver perfil de Marta', exact: true }).click();
  await page.getByRole('button', { name: /Bloquear a Marta/ }).click();
  await expect(page.locator('.swipe-card-info h2')).not.toContainText('Marta');
  const nav = page.locator(testInfo.project.name === 'desktop-chromium' ? '.sidebar nav' : '.bottom-nav');
  await nav.getByRole('button', { name: 'Inicio', exact: true }).click();
  await expect(page.locator('.home-target-people article').filter({ hasText: 'Marta' })).toHaveCount(0);
  await nav.getByRole('button', { name: 'Chat', exact: true }).click();
  await expect(page.locator('.chat-list button').filter({ hasText: 'Marta' })).toHaveCount(0);
  await nav.getByRole('button', { name: 'Explora', exact: true }).click();
  await expect(page.locator('.discover-person-card').filter({ hasText: 'Marta' })).toHaveCount(0);
});

test('people filters affect the active person and likes apply to that person', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar planes', exact: true }).click();
  await page.locator('.discover-person-card').filter({ hasText: 'Marta' }).click();
  await expect(page.locator('.swipe-card-info h2')).toHaveText('Marta, 26');
  await page.getByRole('button', { name: 'Edad', exact: true }).click();
  await expect(page.locator('.swipe-card-info h2')).toHaveText('Sara, 23');
  await page.getByRole('button', { name: 'Me gusta', exact: true }).click();
  await expect(page.locator('.swipe-card-info h2')).toHaveText('Lucía, 24');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('conecta-explore-likes-v1') || '[]'))).toContain('Sara');
  await page.getByRole('button', { name: 'Afinidad', exact: true }).click();
  await expect(page.locator('.swipe-card-info h2')).toHaveText('Marta, 26');
  await page.getByRole('button', { name: 'Cerca de mí', exact: true }).click();
  await expect(page.locator('.swipe-card-info h2')).toHaveText('Lucía, 24');
});
