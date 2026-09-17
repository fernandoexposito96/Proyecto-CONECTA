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
  // Plans now live in the dedicated plan browser; Explora is the social discovery screen.
  await page.getByRole('button',{name:'Explorar planes',exact:true}).click();
  await expect(page.getByText('Waitlist audit plan',{exact:true})).toBeVisible({timeout:15000});
  await expect(page.getByText(/confirmad/i)).toHaveCount(0);
});

test('open real chat refreshes incoming messages without reopening',async({page})=>{
  const {messages}=await backend(page,{chatRefresh:true});
  await page.goto('/');await expect(page.locator('.app-shell')).toBeVisible({timeout:15000});
  await nav(page,'Chat');
  await page.locator('.chat-list button').filter({hasText:'Audit chat'}).click();
  messages.push({id:'incoming-1',conversation_id:'22222222-2222-4222-8222-222222222222',sender_id:'33333333-3333-4333-8333-333333333333',content:'Incoming audit message',created_at:new Date().toISOString()});
  await expect(page.locator('.chat-thread').getByText('Incoming audit message',{exact:true})).toBeVisible({timeout:10000});
  await page.getByRole('textbox',{name:'Escribe un mensaje',exact:true}).fill('Outgoing audit reply');
  await page.getByRole('button',{name:'Enviar mensaje',exact:true}).click();
  await expect(page.locator('.chat-thread .message.sent').getByText('Outgoing audit reply',{exact:true})).toBeVisible();
  expect(messages.filter(message=>message.content==='Outgoing audit reply')).toHaveLength(1);
});

test('anonymous backend outage retains usable login',async({page})=>{
  await backend(page,{backendOutage:true});await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});

test('unsent changes survive reload and merge only into their own account',async({page})=>{
  const {requests}=await backend(page,{state:{'conecta-profile-bio-v1':'Remote bio'}});
  await page.goto('/');await expect(page.locator('.app-shell')).toBeVisible({timeout:15000});
  await page.addInitScript(()=>localStorage.setItem('conecta-pending-state-v1',JSON.stringify({userId:'11111111-1111-4111-8111-111111111111',patch:{'conecta-profile-bio-v1':'Unsent audit bio'}})));
  await page.reload();await expect(page.locator('.app-shell')).toBeVisible({timeout:15000});
  await expect.poll(()=>requests.some(r=>r.table==='merge_my_prototype_state'&&r.body?.p_expected_user==='11111111-1111-4111-8111-111111111111'&&r.body?.p_patch?.['conecta-profile-bio-v1']==='Unsent audit bio')).toBe(true);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('conecta-profile-bio-v1')))).toBe('Unsent audit bio');
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('conecta-pending-state-v1'))).toBeNull();
});

test('temporary plan outage preserves the current account cached plans',async({page})=>{
  const cached={backendId:'22222222-2222-4222-8222-222222222222',title:'Saved offline plan',image:'image-fallback.svg',time:'Mañana · 18:00',place:'Lugar por confirmar',distance:'Ubicación por confirmar',spots:'2 plazas',category:'Social'};
  await backend(page,{state:{'conecta-created-plans-v1':[cached]}});
  await page.route('**/rest/v1/plans?**',route=>route.fulfill({status:503,json:{message:'temporary plan outage'}}));
  await page.goto('/');
  await expect(page.locator('.app-shell')).toBeVisible();
  await page.getByRole('button',{name:'Explorar planes',exact:true}).click();
  await expect(page.getByText('Saved offline plan',{exact:true})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('conecta-created-plans-v1')||'[]').some(plan=>plan.title==='Saved offline plan'))).toBe(true);
});

test('transient hydration outage retries before enabling cloud writes',async({page})=>{
  const {requests}=await backend(page,{prototypeHydrationFailures:2,state:{'conecta-profile-bio-v1':'Recovered remote bio'}});
  await page.goto('/');await expect(page.locator('.app-shell')).toBeVisible({timeout:15000});
  expect(requests.filter(r=>r.table==='prototype_state'&&r.method==='GET')).toHaveLength(3);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('conecta-profile-bio-v1')))).toBe('Recovered remote bio');
  await expect.poll(()=>requests.some(r=>r.table==='merge_my_prototype_state'&&r.method==='POST')).toBe(true);
});

test('unsent chat drafts stay with their own conversation',async({page})=>{
  await backend(page);await page.goto('/');await expect(page.locator('.app-shell')).toBeVisible();
  await nav(page,'Chat');
  const first=await page.locator('.chat-list button strong').nth(0).textContent();
  const second=await page.locator('.chat-list button strong').nth(1).textContent();
  await page.locator('.chat-list button').filter({has:page.getByText(first,{exact:true})}).click();
  await page.getByRole('textbox',{name:'Escribe un mensaje',exact:true}).fill('Private draft A');
  await page.getByRole('button',{name:'Volver a chats',exact:true}).click();
  await page.locator('.chat-list button').filter({has:page.getByText(second,{exact:true})}).click();
  await expect(page.getByRole('textbox',{name:'Escribe un mensaje',exact:true})).toHaveValue('');
  await page.getByRole('textbox',{name:'Escribe un mensaje',exact:true}).fill('Private draft B');
  await page.getByRole('button',{name:'Volver a chats',exact:true}).click();
  await page.locator('.chat-list button').filter({has:page.getByText(first,{exact:true})}).click();
  await expect(page.getByRole('textbox',{name:'Escribe un mensaje',exact:true})).toHaveValue('Private draft A');
});
