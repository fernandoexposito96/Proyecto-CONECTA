import { createClient } from 'npm:@supabase/supabase-js@2.112.4';
import { generateRegistrationOptions, verifyRegistrationResponse } from 'npm:@simplewebauthn/server@13.3.3';

const ORIGIN='https://fernandoexposito96.github.io';
const cors={
  'Access-Control-Allow-Origin':ORIGIN,
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Vary':'Origin',
  'Content-Type':'application/json',
  'Cache-Control':'no-store'
};
const RP_ID='fernandoexposito96.github.io';
const RP_NAME='CONECTA';
const b64url=(bytes:Uint8Array)=>{let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});

Deno.serve(async req=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
  if(req.method!=='POST') return json({error:'method_not_allowed'},405);
  const requestOrigin=req.headers.get('origin');
  if(requestOrigin && requestOrigin!==ORIGIN) return json({error:'origin_not_allowed'},403);
  try{
    const url=Deno.env.get('SUPABASE_URL');
    const anon=Deno.env.get('SUPABASE_ANON_KEY');
    const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if(!url||!anon||!service) return json({error:'server_configuration_missing'},500);
    const authHeader=req.headers.get('Authorization')||'';
    const userClient=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:authHeader}}});
    const {data:{user},error:userError}=await userClient.auth.getUser();
    if(userError||!user) return json({error:'unauthorized'},401);
    const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
    const body=await req.json();

    if(body.action==='options'){
      const {data:existing,error:existingError}=await admin.from('passkey_credentials').select('credential_id,transports').eq('user_id',user.id);
      if(existingError) throw existingError;
      const options=await generateRegistrationOptions({rpName:RP_NAME,rpID:RP_ID,userName:user.email||`user-${user.id}`,userDisplayName:user.user_metadata?.display_name||user.email||'CONECTA',userID:new TextEncoder().encode(user.id),attestationType:'none',authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'preferred',userVerification:'required'},excludeCredentials:(existing||[]).map((c:any)=>({id:c.credential_id,transports:c.transports||['internal']}))});
      const {error:deleteError}=await admin.from('passkey_challenges').delete().eq('user_id',user.id).eq('purpose','register');
      if(deleteError) throw deleteError;
      const {error:insertError}=await admin.from('passkey_challenges').insert({challenge:options.challenge,user_id:user.id,purpose:'register'});
      if(insertError) throw insertError;
      return json(options);
    }

    if(body.action==='verify'){
      const {data:challengeRow,error:challengeError}=await admin.from('passkey_challenges').select('*').eq('user_id',user.id).eq('purpose','register').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(challengeError) throw challengeError;
      if(!challengeRow) return json({error:'challenge_expired'},400);
      const verification=await verifyRegistrationResponse({response:body.response,expectedChallenge:challengeRow.challenge,expectedOrigin:ORIGIN,expectedRPID:RP_ID,requireUserVerification:true});
      if(!verification.verified||!verification.registrationInfo) return json({verified:false},400);
      const {data:consumed,error:consumeError}=await admin.from('passkey_challenges').delete().eq('id',challengeRow.id).select('id').maybeSingle();
      if(consumeError) throw consumeError;
      if(!consumed) return json({error:'challenge_already_used'},409);
      const cred=verification.registrationInfo.credential;
      const {error:upsertError}=await admin.from('passkey_credentials').insert({credential_id:cred.id,user_id:user.id,public_key:b64url(cred.publicKey),counter:cred.counter,transports:cred.transports||['internal'],device_name:'Passkey del dispositivo',last_used_at:new Date().toISOString()});
      if(upsertError) throw upsertError;
      return json({verified:true});
    }
    return json({error:'bad_action'},400);
  }catch(e){return json({error:e instanceof Error?e.message:String(e)},500);}
});
