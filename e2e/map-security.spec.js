import {test,expect} from '@playwright/test';
import {backend} from './helpers.js';

test('map treats plan titles as text instead of executable HTML',async({page})=>{
  const title='<img src=x onerror="window.__mapInjected=true">';
  await page.route('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',route=>route.fulfill({
    contentType:'application/javascript',
    body:`(()=>{
      const item=()=>({
        addTo(){return this},setView(){return this},fitBounds(){return this},
        flyTo(){return this},invalidateSize(){},remove(){},on(){return this},
        bindTooltip(content){
          const tooltip=document.createElement('div');
          tooltip.dataset.mapTooltip='true';
          if(content instanceof Node)tooltip.append(content);else tooltip.innerHTML=content;
          document.body.append(tooltip);
          return this;
        },
      });
      window.L={map:item,tileLayer:item,marker:item,circleMarker:item,
        divIcon:options=>options,latLngBounds:()=>({pad(){return this}}),
        control:{zoom:item}};
    })();`,
  }));
  await backend(page,{plans:[{
    id:'22222222-2222-4222-8222-222222222222',
    creator_id:'11111111-1111-4111-8111-111111111111',
    title,category:'Social',location_name:'Tarragona',
    latitude:41.1189,longitude:1.2445,starts_at:'2030-06-14T18:00:00Z',
    max_people:2,visibility:'public',status:'published',
  }]});
  await page.goto('/');
  await expect(page.locator('.app-shell')).toBeVisible();
  await page.getByTestId('map-entry').click();
  const tooltip=page.locator('[data-map-tooltip]').filter({hasText:title});
  await expect(tooltip).toHaveCount(1);
  await expect(tooltip).toHaveText(title);
  await expect(page.locator('[data-map-tooltip] img')).toHaveCount(0);
  expect(await page.evaluate(()=>Boolean(window.__mapInjected))).toBe(false);
});
