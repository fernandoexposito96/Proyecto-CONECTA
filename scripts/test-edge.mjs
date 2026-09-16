import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function handler(slug,{authenticated=false,consumed=false}={}){
  let serve;let credentialWrites=0;
  const client={
    auth:{getUser:async()=>({data:{user:authenticated?{id:'user',email:'audit@example.invalid'}:null},error:authenticated?null:new Error('invalid session')})},
    from(table){
      let operation='select';
      const query={
        select(){return query},eq(){return query},gt(){return query},order(){return query},limit(){return query},
        delete(){operation='delete';return query},
        update(){operation='update';credentialWrites++;return query},
        insert(){operation='insert';credentialWrites++;return query},
        upsert(){throw new Error('Credential ownership must never be overwritten')},
        single(){return query.maybeSingle()},
        async maybeSingle(){
          if(table==='passkey_credentials')return {data:{credential_id:'credential',user_id:'user',public_key:'AA',counter:0},error:null};
          if(table==='passkey_challenges')return {data:operation==='delete'?(consumed?{id:'challenge'}:null):{id:'challenge',challenge:'challenge'},error:null};
          return {data:null,error:null};
        },
        then(resolve,reject){return query.maybeSingle().then(resolve,reject)},
      };
      return query;
    },
  };
  const source=fs.readFileSync(new URL('../supabase/functions/'+slug+'/index.ts',import.meta.url),'utf8').replace(/^import[^\n]*\n/gm,'');
  const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},reportDiagnostics:true});
  assert.equal(compiled.diagnostics.length,0,slug+' must parse');
  vm.runInNewContext(compiled.outputText,{
    Deno:{env:{get:()=> 'test-only'},serve:callback=>{serve=callback}},
    createClient:()=>client,Request,Response,URL,console,TextEncoder,Uint8Array,atob,btoa,crypto,
    fetch:()=>{throw new Error('Unauthorized request reached an external service')},
    verifyAuthenticationResponse:async()=>({verified:true,authenticationInfo:{newCounter:1}}),
    verifyRegistrationResponse:async()=>({verified:true,registrationInfo:{credential:{id:'credential',publicKey:new Uint8Array([0]),counter:0}}}),
  });
  return {invoke:body=>serve(new Request('https://example.invalid',{method:'POST',headers:{Authorization:'Bearer forged','Content-Type':'application/json'},body:JSON.stringify(body)})),writes:()=>credentialWrites};
}

let passed=0;
for(const slug of ['conecta-product-ai','conecta-moderation','conecta-context']){
  assert.equal((await handler(slug).invoke({})).status,401,slug+' rejects unverified sessions');passed++;
}
for(const slug of ['passkey-auth','passkey-register']){
  const instance=handler(slug,{authenticated:true});
  const response=await instance.invoke({action:'verify',response:{id:'credential'}});
  assert.equal(response.status,409,slug+' rejects a consumed challenge');
  assert.equal(instance.writes(),0,slug+' rejects replay before modifying credentials');passed++;
}
console.log('Edge security regression tests: '+passed+'/'+passed+' OK');
