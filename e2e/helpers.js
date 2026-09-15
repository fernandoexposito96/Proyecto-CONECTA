const userId='11111111-1111-4111-8111-111111111111';
const planId='22222222-2222-4222-8222-222222222222';
const user={id:userId,email:'audit@example.invalid',aud:'authenticated',role:'authenticated',user_metadata:{display_name:'Audit'},app_metadata:{},created_at:'2026-01-01T00:00:00Z'};
const session={access_token:`${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:userId,exp:4102444800,role:'authenticated'})).toString('base64url')}.test`,refresh_token:'test-only',expires_in:3600,expires_at:4102444800,token_type:'bearer',user};

export async function backend(page,{state={},failPrototypeHydration=false,plans=[],planMemberStatus=null,planStartsAt=null,chatRefresh=false,backendOutage=false}={}){
  const requests=[];
  const messages=[];
  await page.addInitScript(({session})=>{
    localStorage.setItem('sb-qdjuypoqiafqncwgmicf-auth-token',JSON.stringify(session));
  },{session});
  await page.route('https://qdjuypoqiafqncwgmicf.supabase.co/**',async route=>{
    if(backendOutage)return route.abort();
    const req=route.request();
    const url=new URL(req.url());
    const table=url.pathname.split('/').at(-1);
    const method=req.method();
    let body=null;
    try{body=req.postDataJSON();}catch{}
    requests.push({table,method,body});
    const object=(req.headers().accept||'').includes('vnd.pgrst.object');
    let data=object?null:[];
    if(table==='user')data=user;
    else if(table==='prototype_state'){
      if(failPrototypeHydration&&method==='GET')return route.fulfill({status:503,json:{message:'offline test'}});
      data=method==='GET'?{state}:null;
    }else if(table==='profiles')data=object?{id:userId,display_name:'Audit',profile_visibility:'public',show_location:true,allow_messages:'everyone'}:[{id:userId,display_name:'Audit'}];
    else if(table==='plans'){
      if(method==='POST'){
        const row={...(body||{}),id:planId,share_slug:null};
        plans.push(row);data=row;
      }else{
        const seeded=planStartsAt?[{id:planId,creator_id:userId,title:'Waitlist audit plan',category:'Deporte',starts_at:planStartsAt,max_people:2,visibility:'public',status:'published'},...plans]:plans;
        data=object?seeded[0]||null:seeded;
      }
    }else if(table==='plan_members')data=url.searchParams.get('select')==='status'?(planMemberStatus?{status:planMemberStatus}:null):[];
    else if(table==='conversation_members'&&chatRefresh)data=[{conversation_id:planId,user_id:userId}];
    else if(table==='conversations'&&chatRefresh)data=[{id:planId,type:'group',title:'Audit chat',plan_id:planId,created_at:'2026-01-01'}];
    else if(table==='messages'&&chatRefresh){
      if(method==='POST')messages.push({id:String(messages.length+1),conversation_id:planId,sender_id:userId,content:body?.content||'',created_at:new Date().toISOString()});
      data=object?messages.at(-1)||null:[...messages].reverse();
    }
    if(method==='HEAD')return route.fulfill({status:200,headers:{'content-range':'*/0'},body:''});
    return route.fulfill({status:200,json:data});
  });
  return {requests,messages};
}

export async function nav(page,name){
  await page.getByRole('button',{name,exact:true}).filter({visible:true}).first().click();
}
