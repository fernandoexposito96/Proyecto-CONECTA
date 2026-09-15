import {test,expect} from '@playwright/test';

const userId='11111111-1111-4111-8111-111111111111';
const planId='22222222-2222-4222-8222-222222222222';
const user={id:userId,email:'audit@example.invalid',aud:'authenticated',role:'authenticated',user_metadata:{display_name:'Audit'},app_metadata:{},created_at:'2026-01-01T00:00:00Z'};
const session={access_token:`${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:userId,exp:4102444800,role:'authenticated'})).toString('base64url')}.test`,refresh_token:'test-only',expires_in:3600,expires_at:4102444800,token_type:'bearer',user};

async function backend(page,{state={},failHydration=false,plans=[],membership=null,chats=false}={}){
  const requests=[];
  const messages=[];
  await page.addInitScript(({session,userId})=>{
    localStorage.setItem('sb-qdjuypoqiafqncwgmicf-auth-token',JSON.stringify(session));
  },{session,userId});
  await page.route('https://qdjuypoqiafqncwgmicf.supabase.co/**',async route=>{
    const req=route.request();const url=new URL(req.url());const table=url.pathname.split('/').at(-1);const method=req.method();
    requests.push({table,method,body:req.postDataJSON()});
    const object=(req.headers().accept||'').includes('vnd.pgrst.object');
    let data=object?null:[];
    if(table==='user')data=user;
    else if(table==='prototype_state'){
      if(failHydration&&method==='GET')return route.fulfill({status:503,json:{message:'offline test'}});
      data=method==='GET'?{state}:null;
    }else if(table==='profiles')data=object?{id:userId,display_name:'Audit',profile_visibility:'public',show_location:true,allow_messages:'everyone'}:[{id:userId,display_name:'Audit'}];
    else if(table==='plans'){
      if(method==='POST'){const row={...req.postDataJSON(),id:planId,share_slug:null};plans.push(row);data=row;}
      else data=object?plans[0]||null:plans;
    }else if(table==='plan_members')data=url.searchParams.get('select')==='status'?(membership?{status:membership}:null):[];
    else if(table==='conversation_members'&&chats)data=[{conversation_id:planId,user_id:userId}];
    else if(table==='conversations'&&chats)data=[{id:planId,type:'group',title:'Audit chat',plan_id:planId,created_at:'2026-01-01'}];
    else if(table==='messages'&&chats){
      if(method==='POST')messages.push({id:String(messages.length+1),conversation_id:planId,sender_id:userId,content:req.postDataJSON().content,created_at:new Date().toISOString()});
      data=object?messages.at(-1)||null:[...messages].reverse();
    }
    if(method==='HEAD')return route.fulfill({status:200,headers:{'content-range':'*/0'},body:''});
    return route.fulfill({status:200,json:data});
  });
  return {requests,messages};
}

async function nav(page,name){await page.getByRole('button',{name,exact:true}).filter({visible:true}).first().click();}

test('authenticated navigation survives malformed persisted state',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await backend(page,{state:{'conecta-created-plans-v1':[null],'conecta-chat-messages-v1':null,'conecta-connections-v1':{},'conecta-settings-account-v1':{}}});
  await page.goto('/');await expect(page.locator('.app-shell')).toBeVisible({timeout:15000});
  for(const name of ['Explora','Chat','Perfil','Inicio']){await nav(page,name);await expect(page.locator('.app-shell')).toBeVisible();await expect(page.locator('.fatal-error')).toHaveCount(0);}
  expect(errors).toEqual([]);
});

test('failed cloud hydration cannot expose or upload the previous account',async({page})=>{
  const {requests}=await backend(page,{failHydration:true});
  await page.addInitScript(()=>{
    localStorage.setItem('conecta-auth-user-v1','previous-account');
    localStorage.setItem('conecta-profile-bio-v1',JSON.stringify('OTHER ACCOUNT PRIVATE BIO'));
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
  await page.locator('.create-plan-card button[type=submit]').click();
  await expect(page.getByText('Plan creado y sincronizado',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Ver planes',exact:true}).click();
  await expect(page.locator('.home-browse-plan-card').filter({hasText:'Audit published plan'})).toBeVisible();
  expect(requests.filter(r=>r.table==='plans'&&r.method==='POST')).toHaveLength(1);
  expect(requests.filter(r=>r.table==='prototype_plans'&&r.method==='POST')).toHaveLength(0);
});

test('waitlisted user is not presented as a confirmed attendee',async({page})=>{
  const date=new Date();date.setHours(18,0,0,0);
  await backend(page,{plans:[{id:planId,creator_id:userId,title:'Waitlist audit plan',category:'Deporte',starts_at:date.toISOString(),max_people:2,visibility:'public',status:'published'}],membership:'waitlist'});
  await page.goto('/?shortcut=now');
  await page.locator('.home-browse-plan-card').filter({hasText:'Waitlist audit plan'}).click();
  await expect(page.getByRole('button',{name:'En lista de espera',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Ya estás dentro',exact:true})).toHaveCount(0);
});

test('open real chat refreshes incoming messages without reopening',async({page})=>{
  const {messages}=await backend(page,{chats:true});
  await page.goto('/?shortcut=chat');
  await page.locator('.chat-list button').filter({hasText:'Audit chat'}).click();
  messages.push({id:'remote',conversation_id:planId,sender_id:'other-user',content:'Incoming verified by test',created_at:new Date().toISOString()});
  await expect(page.getByText('Incoming verified by test',{exact:true})).toBeVisible({timeout:12000});
});

test('anonymous backend outage retains usable login',async({page})=>{
  await page.route('https://qdjuypoqiafqncwgmicf.supabase.co/**',route=>route.abort());
  await page.goto('/');
  await expect(page.locator('.auth-form')).toBeVisible();
  await expect(page.locator('.fatal-error')).toHaveCount(0);
});

test('unsent changes survive reload and merge only into their own account',async({page})=>{
  const {requests}=await backend(page,{state:{'conecta-profile-bio-v1':'Older cloud bio'}});
  await page.addInitScript(({userId})=>{
    localStorage.setItem('conecta-auth-user-v1',userId);
    localStorage.setItem('conecta-pending-state-v1',JSON.stringify({userId,patch:{'conecta-profile-bio-v1':'Recovered offline bio'}}));
  },{userId});
  await page.goto('/');
  await expect(page.locator('.app-shell')).toBeVisible({timeout:15000});
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('conecta-profile-bio-v1')))).toBe('Recovered offline bio');
  await expect.poll(()=>requests.filter(r=>r.table==='merge_my_prototype_state').length).toBeGreaterThan(0);
  const patch=requests.find(r=>r.table==='merge_my_prototype_state').body;
  expect(patch.p_expected_user).toBe(userId);
  expect(patch.p_patch['conecta-profile-bio-v1']).toBe('Recovered offline bio');
});
