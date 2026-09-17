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
