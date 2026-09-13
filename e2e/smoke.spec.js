import {test,expect} from '@playwright/test';

test('CONECTA carga sin pantalla en blanco ni errores fatales',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/',{waitUntil:'networkidle'});
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('body')).not.toHaveText(/^\s*$/);
  const interactive=page.locator('button,a,[role="button"],input');
  expect(await interactive.count()).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('manifest y service worker son accesibles',async({request})=>{
  const manifest=await request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBeTruthy();
  const data=await manifest.json();
  expect(data.id).toBe('./');
  expect(data.start_url).toBe('./');
  expect(data.icons?.some(icon=>icon.purpose==='maskable')).toBeTruthy();
  expect(data.shortcuts?.length).toBeGreaterThanOrEqual(3);
  expect(data.screenshots?.length).toBeGreaterThanOrEqual(2);
  const sw=await request.get('/sw.js');
  expect(sw.ok()).toBeTruthy();
});

test('offline fallback está preparado',async({request})=>{
  const offline=await request.get('/offline.html');
  expect(offline.ok()).toBeTruthy();
  expect(await offline.text()).toContain('Sin conexión');
});
