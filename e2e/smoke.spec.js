import {test,expect} from '@playwright/test';

test('CONECTA carga sin pantalla en blanco ni errores fatales',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/',{waitUntil:'networkidle'});
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('body')).not.toHaveText(/^\s*$/);
  expect(await page.locator('button,a,[role="button"],input').count()).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('login y registro validan formularios reales',async({page})=>{
  await page.goto('/',{waitUntil:'networkidle'});
  await expect(page.getByText('Bienvenido de nuevo')).toBeVisible();
  await page.getByRole('button',{name:'Entrar'}).click();
  await expect(page.getByRole('status')).toContainText('Escribe un correo válido');
  await page.getByRole('button',{name:/Crear una/}).click();
  await expect(page.getByText('Crea tu cuenta')).toBeVisible();
  await page.getByLabel('Correo electrónico').fill('qa@example.com');
  await page.getByLabel('Contraseña').fill('123');
  await page.getByRole('button',{name:'Crear cuenta'}).click();
  await expect(page.getByRole('status')).toContainText('al menos 8 caracteres');
});

test('manifest contiene instalabilidad premium completa',async({request})=>{
  const manifest=await request.get('/manifest.webmanifest');
  expect(manifest.ok()).toBeTruthy();
  const data=await manifest.json();
  expect(data.id).toBe('./');
  expect(data.start_url).toBe('./');
  expect(data.icons?.some(icon=>icon.purpose==='any'&&icon.sizes==='512x512')).toBeTruthy();
  expect(data.icons?.some(icon=>icon.purpose==='maskable'&&icon.sizes==='512x512')).toBeTruthy();
  expect(data.shortcuts?.length).toBeGreaterThanOrEqual(3);
  expect(data.screenshots?.some(item=>item.form_factor==='narrow')).toBeTruthy();
  expect(data.screenshots?.some(item=>item.form_factor==='wide')).toBeTruthy();
});

test('service worker incluye offline, push y background sync',async({request})=>{
  const sw=await request.get('/sw.js');
  expect(sw.ok()).toBeTruthy();
  const source=await sw.text();
  expect(source).toContain("addEventListener('push'");
  expect(source).toContain("addEventListener('notificationclick'");
  expect(source).toContain("addEventListener('sync'");
  const offline=await request.get('/offline.html');
  expect(offline.ok()).toBeTruthy();
  expect(await offline.text()).toContain('Sin conexión');
});

test('index declara Open Graph, preconnect y Apple icons',async({request})=>{
  const response=await request.get('/');
  const html=await response.text();
  expect(html).toContain('property="og:title"');
  expect(html).toContain('name="twitter:card"');
  expect(html).toContain('rel="preconnect"');
  for(const size of ['120x120','152x152','167x167','180x180'])expect(html).toContain(`sizes="${size}"`);
});
