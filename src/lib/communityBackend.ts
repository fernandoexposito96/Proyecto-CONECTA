import { supabase } from './supabase';

export type PersonSearchResult={
  id:string;
  name:string;
  username:string;
  avatar:string;
  city:string;
};

export type ProfileMediaItem={
  id:string;
  userId:string;
  url:string;
  mediaType:'image'|'video';
  sourceType:'profile'|'status'|'plan';
  caption:string;
  createdAt:string;
};

const MEDIA_BUCKET='profile-media';

export async function searchPeopleByName(query:string,limit=20):Promise<PersonSearchResult[]>{
  const clean=query.trim();
  if(clean.length<2)return [];
  const escaped=clean.replace(/[%_]/g,'\\$&');
  const {data,error}=await supabase
    .from('profiles')
    .select('id,display_name,username,avatar_url,city')
    .or(`display_name.ilike.%${escaped}%,username.ilike.%${escaped}%`)
    .limit(limit);
  if(error)throw error;
  return (data||[]).map(row=>({
    id:String(row.id||''),
    name:String(row.display_name||row.username||'Usuario'),
    username:String(row.username||''),
    avatar:String(row.avatar_url||''),
    city:String(row.city||''),
  })).filter(item=>item.id);
}

export async function uploadProfileMedia(file:File,sourceType:'profile'|'status'|'plan'='profile',caption=''):Promise<ProfileMediaItem>{
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('Necesitas iniciar sesión para subir contenido.');

  const kind:'image'|'video'=file.type.startsWith('video/')?'video':'image';
  if(kind==='image'&&!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type))throw new Error('Formato de imagen no compatible.');
  if(kind==='video'&&!['video/mp4','video/webm','video/quicktime'].includes(file.type))throw new Error('Formato de vídeo no compatible.');
  if(file.size>50*1024*1024)throw new Error('El archivo supera el máximo de 50 MB.');

  const extension=(file.name.split('.').pop()||(kind==='video'?'mp4':'jpg')).toLowerCase().replace(/[^a-z0-9]/g,'');
  const path=`${user.id}/${sourceType}/${crypto.randomUUID()}.${extension}`;
  const {error:uploadError}=await supabase.storage.from(MEDIA_BUCKET).upload(path,file,{contentType:file.type,cacheControl:'3600',upsert:false});
  if(uploadError)throw uploadError;

  const {data:row,error:insertError}=await supabase
    .from('profile_media')
    .insert({user_id:user.id,storage_path:path,media_type:kind,source_type:sourceType,caption:caption.trim()})
    .select('id,user_id,storage_path,media_type,source_type,caption,created_at')
    .single();
  if(insertError){
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    throw insertError;
  }
  const {data:urlData}=supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return {
    id:String(row.id),
    userId:String(row.user_id),
    url:urlData.publicUrl,
    mediaType:row.media_type==='video'?'video':'image',
    sourceType:row.source_type==='status'||row.source_type==='plan'?row.source_type:'profile',
    caption:String(row.caption||''),
    createdAt:String(row.created_at||''),
  };
}

export async function loadProfileMedia(userId?:string):Promise<ProfileMediaItem[]>{
  let target=userId||'';
  if(!target){
    const {data:{user},error}=await supabase.auth.getUser();
    if(error)throw error;
    target=user?.id||'';
  }
  if(!target)return [];
  const {data,error}=await supabase
    .from('profile_media')
    .select('id,user_id,storage_path,media_type,source_type,caption,created_at')
    .eq('user_id',target)
    .order('created_at',{ascending:false})
    .limit(100);
  if(error)throw error;
  return (data||[]).map(row=>{
    const path=String(row.storage_path||'');
    const {data:urlData}=supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    return {
      id:String(row.id),
      userId:String(row.user_id),
      url:urlData.publicUrl,
      mediaType:row.media_type==='video'?'video':'image',
      sourceType:row.source_type==='status'||row.source_type==='plan'?row.source_type:'profile',
      caption:String(row.caption||''),
      createdAt:String(row.created_at||''),
    };
  });
}

export async function removeProfileMedia(item:ProfileMediaItem):Promise<void>{
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('Necesitas iniciar sesión.');
  const {data,error}=await supabase.from('profile_media').select('storage_path,user_id').eq('id',item.id).single();
  if(error)throw error;
  if(String(data.user_id)!==user.id)throw new Error('No puedes eliminar contenido de otro usuario.');
  const path=String(data.storage_path||'');
  const {error:deleteError}=await supabase.from('profile_media').delete().eq('id',item.id).eq('user_id',user.id);
  if(deleteError)throw deleteError;
  if(path){
    const {error:storageError}=await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    if(storageError)console.warn('CONECTA media storage cleanup failed',storageError);
  }
}
