import {test,expect} from '@playwright/test';

test.use({serviceWorkers:'allow'});

test('installed application survives offline reload without a blank screen',async({page,context})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.auth-form')).toBeVisible();
  await page.evaluate(async()=>{
    await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.auth-form')).toBeVisible();
  await page.locator('.auth-switch').click();
  await expect(page.locator('.auth-form')).toBeVisible();
  expect(errors).toEqual([]);
});

test('auxiliary offline page cannot replace the installed application',async({page,context})=>{
  await page.goto('/');
  await expect(page.locator('.auth-form')).toBeVisible();
  await page.evaluate(async()=>{
    await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  });
  await page.goto('/offline.html');
  await context.setOffline(true);
  await page.goto('/?shortcut=chat');
  await expect(page.locator('.auth-form')).toBeVisible();
});

test('installation metadata and bitmap icons are available',async({page,request})=>{
  await page.goto('/');
  const manifestURL=await page.locator('link[rel="manifest"]').evaluate(link=>link.href);
  const response=await request.get(manifestURL);
  expect(response.ok()).toBeTruthy();
  const manifest=await response.json();
  expect(manifest.display).toBe('standalone');
  expect(new URL(manifest.start_url,manifestURL).origin).toBe(new URL(manifestURL).origin);
  for(const purpose of ['any','maskable']){
    const icon=manifest.icons.find(icon=>icon.type==='image/png'&&icon.purpose===purpose);
    expect(icon).toBeTruthy();
    const dimensions=await page.evaluate(async url=>{
      const image=new Image();image.src=url;await image.decode();
      return [image.naturalWidth,image.naturalHeight];
    },new URL(icon.src,manifestURL).href);
    expect(dimensions).toEqual(icon.sizes.split('x').map(Number));
  }
  const apple=await page.locator('link[rel="apple-touch-icon"]').first().getAttribute('href');
  expect((await request.get(new URL(apple,manifestURL).href)).ok()).toBeTruthy();
});
