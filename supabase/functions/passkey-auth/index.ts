import { createClient } from 'npm:@supabase/supabase-js@2.112.4';
import { generateAuthenticationOptions, verifyAuthenticationResponse } from 'npm:@simplewebauthn/server@13.3.3';

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
const APP_REDIRECT=`${ORIGIN}/Proyecto-CONECTA/`;
const fromB64url=(value:string)=>{const s=value.replace(/-/g,'+').replace(/_/g,'/');const raw=atob(s+'==='.slice((s.length+3)%4));return Uint8Array.from(raw,c=>c.charCodeAt(0));};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});

Deno.serve(async req=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
  if(req.method!=='POST') return json({error:'method_not_allowed'},405);
  const requestOrigin=req.headers.get('origin');
  if(requestOrigin && requestOrigin!==ORIGIN) return json({error:'origin_not_allowed'},403);
  try{
    const url=Deno.env.get('SUPABASE_URL');
    const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if(!url||!service) return json({error:'server_configuration_missing'},500);
    const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
    const body=await req.json();

    if(body.action==='options'){
      const credentialId=String(body.credentialId||'');
      if(!credentialId) return json({error:'missing_credential'},400);
      const {data:cred,error:credError}=await admin.from('passkey_credentials').select('*').eq('credential_id',credentialId).maybeSingle();
      if(credError) throw credError;
      if(!cred) return json({error:'credential_not_found'},404);
      const options=await generateAuthenticationOptions({rpID:RP_ID,userVerification:'required',allowCredentials:[{id:cred.credential_id,transports:cred.transports||['internal']}]});
      const {error:deleteError}=await admin.from('passkey_challenges').delete().eq('user_id',cred.user_id).eq('purpose','authenticate');
      if(deleteError) throw deleteError;
      const {error:insertError}=await admin.from('passkey_challenges').insert({challenge:options.challenge,user_id:cred.user_id,purpose:'authenticate'});
      if(insertError) throw insertError;
      return json(options);
    }

    if(body.action==='verify'){
      const credentialId=String(body?.response?.id||body?.credentialId||'');
      if(!credentialId) return json({error:'missing_credential'},400);
      const {data:cred,error:credError}=await admin.from('passkey_credentials').select('*').eq('credential_id',credentialId).maybeSingle();
      if(credError) throw credError;
      if(!cred) return json({error:'credential_not_found'},404);
      const {data:challengeRow,error:challengeError}=await admin.from('passkey_challenges').select('*').eq('user_id',cred.user_id).eq('purpose','authenticate').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(challengeError) throw challengeError;
      if(!challengeRow) return json({error:'challenge_expired'},400);
      const verification=await verifyAuthenticationResponse({response:body.response,expectedChallenge:challengeRow.challenge,expectedOrigin:ORIGIN,expectedRPID:RP_ID,requireUserVerification:true,credential:{id:cred.credential_id,publicKey:fromB64url(cred.public_key),counter:Number(cred.counter||0),transports:cred.transports||['internal']}});
      if(!verification.verified) return json({verified:false},401);
      const {data:consumed,error:consumeError}=await admin.from('passkey_challenges').delete().eq('id',challengeRow.id).select('id').maybeSingle();
      if(consumeError) throw consumeError;
      if(!consumed) return json({error:'challenge_already_used'},409);
      const {error:updateError}=await admin.from('passkey_credentials').update({counter:verification.authenticationInfo.newCounter,last_used_at:new Date().toISOString()}).eq('credential_id',cred.credential_id);
      if(updateError) throw updateError;
      const {data:{user},error:userError}=await admin.auth.admin.getUserById(cred.user_id);
      if(userError) throw userError;
      if(!user?.email) return json({error:'user_email_missing'},500);
      const {data:linkData,error:linkError}=await admin.auth.admin.generateLink({type:'magiclink',email:user.email,options:{redirectTo:APP_REDIRECT}});
      if(linkError) throw linkError;
      return json({verified:true,token_hash:linkData.properties.hashed_token});
    }
    return json({error:'bad_action'},400);
  }catch(e){return json({error:e instanceof Error?e.message:String(e)},500);}
});
