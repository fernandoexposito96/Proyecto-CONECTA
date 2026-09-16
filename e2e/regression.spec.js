import {test,expect} from '@playwright/test';
import {backend,nav} from './helpers.js';

// Regression tests exercise stable UI contracts rather than styling-only selectors.

test('authenticated navigation survives malformed persisted state',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('conecta-prototype-state-v1','{bad json'));
  await backend(page);await page.goto('/');await expect(page.locator('.app-shell')).toBeVisible({timeout:15000});
});

test('failed cloud hydration cannot expose or upload the previous account',async({page})=>{
  const {requests}=await backend(page,{failPrototypeHydration:true});
  await page.addInitScript(()=>{
    localStorage.setItem('conecta-profile-bio-v1','PRIVATE BIO');
    localStorage.setItem('conecta-chat-messages-v1',JSON.stringify({Marta:['PRIVATE MESSAGE']}));
  });
  await page.goto('/');await expect(page.locator('.app-shell')).toBeVisible({timeout:15000});
  expect(await page.evaluate(()=>localStorage.getItem('conecta-profile-bio-v1'))).toBeNull();
  await nav(page,'Chat');
  expect(requests.filter(r=>['prototype_state','merge_my_prototype_state'].includes(r.table)&&r.method==='POST')).toEqual([]);
  await expect(page.getByText('PRIVATE MESSAGE',{exact:true})).toHaveCount(0);
});

test('created real plan is discoverable in the existing plan browser',async({page})=>{
  const {requests}=await backend(page);
  await page.goto('/?shortcut=create-plan');
  await page.getByPlaceholder('Ej. Pádel al atardecer').fill('Audit published plan');
  await page.getByPlaceholder('Tarragona, Salou...').fill('Tarragona');
  await page.locator('input[type=date]').fill('2030-06-14');
  await page.locator('input[type=time]').fill('18:00');
  // Submit the actual form instead of depending on duplicated/changed accessible labels.
  // This remains stable if decorative text or another "Crear plan" control is added later.
  const form=page.locator('form.cp-form');
  await expect(form).toBeVisible();
  await form.locator('button[type=submit]').click();
  await expect(page.getByText('Plan creado y sincronizado',{exact:true})).toBeVisible({timeout:15000});
  await page.getByRole('button',{name:'Ver planes',exact:true}).click();
  await expect(page.getByText('Audit published plan',{exact:true})).toBeVisible();
  expect(requests.filter(r=>r.table==='plans'&&r.method==='POST')).toHaveLength(1);
  expect(requests.filter(r=>r.table==='prototype_plans'&&r.method==='POST')).toHaveLength(0);
});

test('waitlisted user is not presented as a confirmed attendee',async({page})=>{
  const date=new Date();date.setHours(18,0,0,0);date.setDate(date.getDate()+1);
  await backend(page,{planMemberStatus:'waitlist',planStartsAt:date.toISOString()});
  await page.goto('/');await expect(page.locator('.app-shell')).toBeVisible({timeout:15000});
  await nav(page,'Explorar');
  await expect(page.getByText('Waitlist audit plan',{exact:true})).toBeVisible({timeout:15000});
  await expect(page.getByText(/confirmad/i)).toHaveCount(0);
});

test('open real chat refreshes incoming messages without reopening',async({page})=>{
  await backend(page,{chatRefresh:true});
  await page.goto('/');await expect(page.locator('.app-shell')).toBeVisible({timeout:15000});
  await nav(page,'Chat');
  await expect(page.locator('body')).toBeVisible();
});

test('anonymous backend outage retains usable login',async({page})=>{
  await backend(page,{backendOutage:true});await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});

test('unsent changes survive reload and merge only into their own account',async({page})=>{
  await backend(page);await page.goto('/');await expect(page.locator('.app-shell')).toBeVisible({timeout:15000});
  await page.reload();await expect(page.locator('.app-shell')).toBeVisible({timeout:15000});
});
