import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const openApp = async (page: Parameters<typeof test>[0] extends never ? never : any) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('body')).toBeVisible();
  await page.waitForTimeout(500);
};

test.describe('CONECTA · NORA functional checks', () => {
  test('loads the application without fatal browser errors', async ({ page }) => {
    const fatalErrors: string[] = [];
    page.on('pageerror', error => fatalErrors.push(error.message));

    await openApp(page);
    await expect(page.locator('body')).not.toHaveText(/404|application error|failed to load/i);
    expect(fatalErrors, fatalErrors.join('\n')).toEqual([]);
  });

  test('has no horizontal overflow on mobile viewport', async ({ page }) => {
    await openApp(page);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
  });

  test('interactive controls have usable names', async ({ page }) => {
    await openApp(page);
    const unnamed = await page.locator('button, a[href], input, select, textarea').evaluateAll(elements =>
      elements
        .filter((el: Element) => {
          const node = el as HTMLElement;
          const aria = node.getAttribute('aria-label') || node.getAttribute('aria-labelledby') || node.getAttribute('title');
          const text = (node.textContent || '').trim();
          const input = node as HTMLInputElement;
          return !aria && !text && !input.placeholder && !input.value;
        })
        .slice(0, 30)
        .map((el: Element) => el.outerHTML.slice(0, 300)),
    );
    expect(unnamed, unnamed.join('\n')).toEqual([]);
  });

  test('passes automated accessibility scan for serious and critical violations', async ({ page }) => {
    await openApp(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const severe = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(
      severe,
      severe.map(v => `${v.id}: ${v.help} (${v.nodes.length})`).join('\n'),
    ).toEqual([]);
  });

  test('primary navigation controls do not point to empty javascript links', async ({ page }) => {
    await openApp(page);
    const badLinks = await page.locator('a').evaluateAll(links =>
      links
        .map(link => ({ href: link.getAttribute('href'), text: (link.textContent || '').trim() }))
        .filter(item => item.href === '#' || item.href === '' || /^javascript:/i.test(item.href || ''))
        .slice(0, 50),
    );
    expect(badLinks, JSON.stringify(badLinks, null, 2)).toEqual([]);
  });
});
