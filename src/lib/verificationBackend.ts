import { supabase } from './supabase';

export type IdentityVerificationStatus='none'|'pending'|'approved'|'rejected';

export type IdentityVerificationState={
  status:IdentityVerificationStatus;
  createdAt:string|null;
  reviewNote:string|null;
};

export async function loadIdentityVerification():Promise<IdentityVerificationState>{
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)return {status:'none',createdAt:null,reviewNote:null};
  const {data,error}=await supabase
    .from('identity_verifications')
    .select('status,created_at,review_note')
    .eq('user_id',user.id)
    .order('created_at',{ascending:false})
    .limit(1)
    .maybeSingle();
  if(error)throw error;
  if(!data)return {status:'none',createdAt:null,reviewNote:null};
  const raw=String(data.status||'pending');
  const status:IdentityVerificationStatus=raw==='approved'||raw==='rejected'||raw==='pending'?raw:'pending';
  return {
    status,
    createdAt:typeof data.created_at==='string'?data.created_at:null,
    reviewNote:typeof data.review_note==='string'?data.review_note:null,
  };
}

export async function submitSelfieVerification(file:File){
  if(!file.type.startsWith('image/'))throw new Error('Selecciona una foto válida.');
  if(file.size>15_000_000)throw new Error('La foto supera el límite de 15 MB.');
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('Necesitas iniciar sesión para verificar tu identidad.');

  const extension=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
  const path=`${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const {error:uploadError}=await supabase.storage.from('identity-video').upload(path,file,{upsert:false,contentType:file.type});
  if(uploadError)throw uploadError;

  const {error:insertError}=await supabase.from('identity_verifications').insert({
    user_id:user.id,
    video_path:path,
    snapshot_path:path,
    status:'pending',
    consent_at:new Date().toISOString(),
  });
  if(insertError){
    await supabase.storage.from('identity-video').remove([path]);
    throw insertError;
  }
  return loadIdentityVerification();
}
