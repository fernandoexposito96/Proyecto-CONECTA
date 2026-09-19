import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source=fs.readFileSync('src/lib/cloud.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
function harness(){
  const entries=new Map([['conecta-auth-user-v1','account-a']]);
  const timers=new Map(),calls=[];let counter=0,session={user:{id:'account-a'}},getSession=null,rpcError=null;
  const exports={};
  const client={auth:{getSession:()=>getSession?getSession():Promise.resolve({data:{session},error:null})},
    rpc(name,args){calls.push({name,args});return {abortSignal:async()=>({error:rpcError})};}};
  const storage={getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,value),removeItem:key=>entries.delete(key)};
  vm.runInNewContext(compiled,{
    exports,console:{warn(){}},AbortSignal,
    window:{localStorage:storage,setTimeout:callback=>{timers.set(++counter,callback);return counter;},clearTimeout:id=>timers.delete(id)},
    require:name=>name==='./supabase'?{supabase:client}:name==='./identity'?{demoAccount:{email:'demo@example.invalid'}}:name==='./privacy'?{defaultPrivacySettings:{}}:{},
  });
  return {api:exports,calls,entries,timers,
    setSession:value=>{session=value;},setGetSession:fn=>{getSession=fn;},setRpcError:error=>{rpcError=error;},
    async flush(){const entry=timers.entries().next().value;assert.ok(entry,'flush scheduled');timers.delete(entry[0]);entry[1]();await new Promise(setImmediate);},
  };
}
const bio='conecta-profile-bio-v1';
{
  const h=harness();h.api.queueCloudStateSave(bio,'private-a');
  h.setSession({user:{id:'account-b'}});
  await h.flush();
  assert.equal(h.calls.length,0,'account A must never be uploaded as account B');
  assert.equal(JSON.parse(h.entries.get('conecta-pending-state-v1')).userId,'account-a');
  h.setSession({user:{id:'account-a'}});await h.flush();
  assert.equal(h.calls.length,1);assert.equal(h.calls[0].args.p_expected_user,'account-a');
  assert.equal(h.calls[0].args.p_patch[bio],'private-a');
  assert.equal(h.entries.has('conecta-pending-state-v1'),false);
}
{
  const h=harness();h.api.queueCloudStateSave(bio,'durable');
  h.setSession(null);await h.flush();
  assert.equal(h.calls.length,0);assert.ok(h.entries.has('conecta-pending-state-v1'));
  h.setSession({user:{id:'account-a'}});await h.flush();
  assert.equal(h.calls[0].args.p_patch[bio],'durable');
}
{
  const h=harness();let resolve;
  h.setGetSession(()=>new Promise(done=>{resolve=done;}));
  h.api.queueCloudStateSave(bio,'old');await h.flush();
  h.api.resetCloudStateQueue();h.entries.set('conecta-auth-user-v1','account-b');
  h.api.queueCloudStateSave(bio,'new');
  resolve({data:{session:{user:{id:'account-a'}}},error:null});
  await new Promise(setImmediate);
  assert.equal(h.calls.length,0,'stale in-flight flush must be invalidated');
  h.setGetSession(null);h.setSession({user:{id:'account-b'}});await h.flush();
  assert.equal(h.calls[0].args.p_expected_user,'account-b');assert.equal(h.calls[0].args.p_patch[bio],'new');
}
{
  const h=harness();h.setRpcError(new Error('offline'));
  h.api.queueCloudStateSave(bio,'old');await h.flush();
  h.api.queueCloudStateSave(bio,'latest');h.setRpcError(null);await h.flush();
  assert.equal(h.calls.at(-1).args.p_patch[bio],'latest');
  assert.equal(h.entries.has('conecta-pending-state-v1'),false);
}
{
  const h=harness();h.entries.delete('conecta-auth-user-v1');h.api.queueCloudStateSave(bio,'unowned');
  assert.equal(h.timers.size,0);assert.equal(h.calls.length,0);
}
console.log('Cloud synchronization ownership and durable retry: 5 scenarios OK');


// Automatic preference writes must share the cloud hydration and account boundary.
{
  const entries=new Map(),settingsCalls=[],cloudCalls=[],events=[];
  const storageExports={};
  const compiledStorage=ts.transpileModule(fs.readFileSync('src/lib/storage.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  let quota=false;
  vm.runInNewContext(compiledStorage,{
    exports:storageExports,console:{warn(){}},
    CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},
    window:{localStorage:{getItem:key=>entries.get(key)??null,setItem:(key,value)=>{if(quota)throw new Error('quota');entries.set(key,value);}},dispatchEvent:event=>events.push(event)},
    require:()=>({syncSettingStorageKey:async(key,value)=>settingsCalls.push({key,value})}),
  });
  const key=storageExports.storageKeys.theme;
  storageExports.saveStored(key,'Oscuro');
  assert.equal(entries.get(key),JSON.stringify('Oscuro'),'offline edits remain local');
  assert.equal(events.length,1);
  assert.equal(settingsCalls.length,0,'failed or unfinished hydration must not write settings remotely');
  storageExports.setCloudStorageWriter((key,value)=>cloudCalls.push({key,value}));
  storageExports.saveStored(key,'Claro');
  assert.equal(settingsCalls.length,1);assert.equal(cloudCalls.length,1);
  quota=true;storageExports.saveStored(key,'Sistema');
  assert.equal(settingsCalls.length,1);assert.equal(cloudCalls.length,1);
  storageExports.setCloudStorageWriter(null);quota=false;storageExports.saveStored(key,'Oscuro');
  assert.equal(settingsCalls.length,1,'logout disables every automatic remote writer');
  console.log('✓ Preference writes wait for hydration and successful local persistence');
}
{
  const entries=new Map([['conecta-auth-user-v1','account-a']]),writes=[];
  let resolveUser;
  const api={};
  const client={
    auth:{getUser:()=>new Promise(resolve=>{resolveUser=resolve;})},
    from:table=>({upsert:async payload=>{writes.push({table,payload});return {error:null};}}),
  };
  const compiledSettings=ts.transpileModule(fs.readFileSync('src/lib/settingsBackend.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(compiledSettings,{exports:api,console,window:{localStorage:{getItem:key=>entries.get(key)??null}},require:()=>({supabase:client})});
  for(const key of ['conecta-theme','conecta-language','conecta-notification-toggles-v1']){
    const value=key==='conecta-theme'?'Oscuro':key==='conecta-language'?'English':{messages:true,requests:true,planUpdates:true,reminders:true,news:false,offers:false};
    entries.set('conecta-auth-user-v1','account-a');
    if(typeof value==='object')entries.set(key,JSON.stringify(value));
    const pending=api.syncSettingStorageKey(key,value);
    entries.set('conecta-auth-user-v1','account-b');
    resolveUser({data:{user:{id:'account-b'}},error:null});
    assert.equal(await pending,false);
  }
  assert.equal(writes.length,0,'late account A preferences must not be sent as account B');
  entries.set('conecta-auth-user-v1','account-a');
  const stale=api.syncSettingStorageKey('conecta-theme','Oscuro');
  entries.delete('conecta-auth-user-v1');
  resolveUser({data:{user:{id:'account-a'}},error:null});
  assert.equal(await stale,false);
  assert.equal(writes.length,0,'logout invalidates an in-flight preference write');
  entries.set('conecta-auth-user-v1','account-a');
  const valid=api.syncSettingStorageKey('conecta-theme','Oscuro');
  resolveUser({data:{user:{id:'account-a'}},error:null});
  assert.equal(await valid,true);
  assert.equal(writes.length,1);assert.equal(writes[0].payload.user_id,'account-a');
  assert.equal(writes[0].payload.appearance,'dark');
  console.log('✓ Delayed preferences remain bound to their original account');
}
