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
