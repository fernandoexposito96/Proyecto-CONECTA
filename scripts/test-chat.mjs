import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const compiled=ts.transpileModule(fs.readFileSync('src/lib/chatBackend.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
function harness({user='me',rpcData='conversation',rpcError=null,group=false}={}){
  const calls=[],exports={};
  const supabase={auth:{getUser:async()=>({data:{user:user?{id:user}:null},error:null})},
    rpc:async(name,args)=>{calls.push({name,args});return {data:rpcData,error:rpcError};},
    from(table){
      if(!group)throw new Error('Direct creation must not use non-atomic table writes');
      let result;
      if(table==='conversation_members')result=[{conversation_id:'group',user_id:'me'},{conversation_id:'group',user_id:'blocked-peer'}];
      else if(table==='conversations')result=[{id:'group',type:'group',title:'Group',created_at:'2026-01-01'}];
      else if(table==='profiles')result=[{id:'blocked-peer',display_name:'Peer'}];
      else if(table==='messages')result=[];
      else throw new Error(table);
      const q={select(){return q;},eq(){return q;},in(){return q;},order(){return q;},limit(){return q;},then(resolve){return Promise.resolve({data:result,error:null,count:0}).then(resolve);}};
      return q;
    }};
  vm.runInNewContext(compiled,{exports,require:()=>({supabase})});
  return {api:exports,calls};
}
{
  const h=harness();assert.equal(await h.api.ensureDirectConversation('peer'),'conversation');
  assert.equal(h.calls.length,1);assert.equal(h.calls[0].name,'get_or_create_direct_conversation');assert.equal(h.calls[0].args.other_user,'peer');
}
for(const options of [{user:null},{rpcData:null},{rpcError:new Error('denied')}]){
  const h=harness(options);await assert.rejects(()=>h.api.ensureDirectConversation('peer'));
}
{
  const h=harness();await assert.rejects(()=>h.api.ensureDirectConversation('me'));await assert.rejects(()=>h.api.ensureDirectConversation(''));assert.equal(h.calls.length,0);
}
{
  const h=harness({group:true});const chats=await h.api.loadBackendChats();
  assert.equal(chats.length,1);assert.equal(chats[0].isGroup,true);
  assert.equal(chats[0].userId,undefined,'a group must not be classified as a direct chat with an arbitrary member');
}
console.log('Chat behavior: atomic RPC, error propagation, participant validation and group identity passed');
