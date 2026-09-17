import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('src/lib/supabase.ts','utf8');
const url=source.match(/const supabaseUrl='([^']+)'/)?.[1];
const key=source.match(/const supabasePublishableKey='([^']+)'/)?.[1];
assert.ok(url&&key,'public backend configuration must be available');
for(const slug of ['passkey-register','conecta-product-ai','conecta-moderation','conecta-context']){
  const response=await fetch(url+'/functions/v1/'+slug,{
    method:'POST',headers:{apikey:key,Authorization:'Bearer invalid-test-token','Content-Type':'application/json'},
    body:'{}',signal:AbortSignal.timeout(20000),
  });
  assert.equal(response.status,401,slug+' must reject an invalid session');
  await response.arrayBuffer();
  console.log('✓ '+slug+' rejects invalid sessions in production');
}
const passkey=await fetch(url+'/functions/v1/passkey-auth',{
  method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({action:'verify',response:{}}),
  signal:AbortSignal.timeout(20000),
});
assert.equal(passkey.status,400);
assert.equal((await passkey.json()).error,'missing_credential');
assert.equal(passkey.headers.get('cache-control'),'no-store');
console.log('✓ Production passkey handler is active and rejects missing credentials without caching');

const directChat=await fetch(url+'/rest/v1/rpc/get_or_create_direct_conversation',{
  method:'POST',headers:{apikey:key,'Content-Type':'application/json'},
  body:JSON.stringify({other_user:'11111111-1111-4111-8111-111111111111'}),signal:AbortSignal.timeout(20000),
});
assert.ok([401,403].includes(directChat.status),'anonymous direct-chat RPC must be denied');
await directChat.arrayBuffer();
console.log('✓ Production direct-chat RPC rejects anonymous callers');
