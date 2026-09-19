import {test,expect} from '@playwright/test';
import {backend} from './helpers.js';

const homeBack=page=>page.getByRole('button',{name:'Volver al Inicio',exact:true});
async function expectHomeScreen(page,mode,title,url){
  await expect(page.locator('.home-browse-page')).toHaveAttribute('data-home-screen',mode);
  await expect(page.locator('.home-browse-heading h1')).toHaveText(title);
  await expect(homeBack(page)).toBeVisible();
  await expect(page.locator('.explore-social-v2,.chat-page,.profile-page')).toHaveCount(0);
  expect(page.url()).toBe(url);
}

test('every home section opens its own screen and returns to home',async({page})=>{
  await backend(page);await page.goto('/');await expect(page.locator('.home-target')).toBeVisible();
  const url=page.url();
  const destinations=[
    ['.home-target-hero button','all','Explorar planes'],
    ['.home-target-section:has(h2:text-is("Explora por categorías")) .home-target-head button','categories','Categorías'],
    ['[data-testid="nearby-entry"]','near','Descubre planes cerca de ti'],
    ['.now-section .section-head button','when','¿Cuándo quieres salir?'],
    ['.home-target-section:has(h2:text-is("Personas compatibles")) .home-target-head button','people','Personas compatibles'],
    ['.home-target-section:has(h2:text-is("Escapadas y eventos")) .home-target-head button','escapes','Escapadas y eventos'],
    ['.home-benefits .home-target-head button','benefits','Ventajas CONECTA'],
    ['.premium-banner button','premium','CONECTA Premium'],
  ];
  for(const [selector,mode,title] of destinations){
    await page.locator(selector).click();
    await expectHomeScreen(page,mode,title,url);
    await homeBack(page).click();await expect(page.locator('.home-target')).toBeVisible();
  }
});

test('home category, time and benefit cards stay inside their own home flow',async({page})=>{
  await backend(page);await page.goto('/');await expect(page.locator('.home-target')).toBeVisible();
  const url=page.url();
  const categories=await page.locator('.home-target-categories button').count();
  for(let i=0;i<categories;i++){
    await page.locator('.home-target-categories button').nth(i).click();
    await expect(page.locator('.home-browse-page')).toHaveAttribute('data-home-screen','categories');
    await page.getByRole('button',{name:'Todas las categorías',exact:true}).click();
    await expect(page.locator('.home-browse-categories')).toBeVisible();
    await homeBack(page).click();
  }
  for(const [label,mode,title] of [['Ahora mismo','today','Planes de hoy'],['Esta tarde','afternoon','Esta tarde'],['Esta noche','tonight','Esta noche'],['Este finde','weekend','Este finde']]){
    await page.locator('.quick-grid button').filter({hasText:label}).click();
    await expectHomeScreen(page,mode,title,url);await homeBack(page).click();
  }
  for(const title of ['Fitness','Viajes','Gastronomía']){
    await page.locator('.home-benefit-grid button').filter({hasText:title.toUpperCase()}).click();
    await expectHomeScreen(page,'benefits',title,url);
    await expect(page.locator('.home-browse-benefit-detail')).toBeVisible();
    await page.getByRole('button',{name:'Todas las ventajas',exact:true}).click();
    await expect(page.locator('.home-benefit-grid button')).toHaveCount(3);
    await homeBack(page).click();
  }
});

test('plan details and home search return to their own screen without external navigation',async({page})=>{
  await backend(page);await page.goto('/');await expect(page.locator('.home-target')).toBeVisible();
  const url=page.url();
  await page.getByRole('button',{name:'Explorar planes',exact:true}).click();
  await page.getByRole('button',{name:'Ver plan',exact:false}).first().click();
  await expect(page.locator('.detail-page-shell')).toBeVisible();
  await page.getByRole('button',{name:'Volver',exact:true}).click();
  await expectHomeScreen(page,'all','Explorar planes',url);await homeBack(page).click();
  await page.locator('.desktop-search input:visible,.mobile-home-search:visible').first().click();
  await expectHomeScreen(page,'search','Buscar planes',url);
  await page.getByRole('searchbox',{name:'Buscar en los planes',exact:true}).fill('zzzz-no-plan');
  await expect(page.getByRole('status')).toHaveText('No hay planes que coincidan con tu búsqueda.');
  await page.getByRole('searchbox',{name:'Buscar en los planes',exact:true}).fill('');
  await expect(page.locator('.home-browse-plan-card').first()).toBeVisible();
  await homeBack(page).click();
});

test('home Premium retains its demo request without opening settings or charging',async({page})=>{
  const {requests}=await backend(page);await page.goto('/');await expect(page.locator('.home-target')).toBeVisible();
  await page.locator('.premium-banner button').click();
  await page.getByRole('button',{name:'Hazte Premium',exact:false}).click();
  await expect(page.locator('.settings-success')).toContainText('pago real');
  await homeBack(page).click();await page.locator('.premium-banner button').click();
  await expect(page.getByRole('button',{name:'Solicitud iniciada',exact:false})).toBeVisible();
  expect(requests.some(r=>/checkout|payment|billing/.test(r.table))).toBe(false);
});
