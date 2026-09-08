import type { BlockedUser, PrivacyFieldKey, PrivacySettings } from '../types';
import { supabase } from './supabase';

type ProfilePrivacyRow={
  profile_visibility:string|null;
  show_location:boolean|null;
  allow_messages:string|null;
};

const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isRealUserId(value:string){
  return uuidPattern.test(value);
}

function mergeProfilePrivacy(row:ProfilePrivacyRow,current:PrivacySettings):PrivacySettings{
  return {
    ...current,
    profileVisibility:row.profile_visibility==='connections'||row.profile_visibility==='private'?'Solo conexiones':'Todos',
    locationSharing:row.show_location===false?'Nunca':current.locationSharing==='Nunca'?'Al usar la app':current.locationSharing,
    messagePermission:row.allow_messages==='everyone'?'Todos':'Solo conexiones',
  };
}

function profilePayload(settings:PrivacySettings){
  return {
    profile_visibility:settings.profileVisibility==='Todos'?'public':'connections',
    show_location:settings.locationSharing!=='Nunca',
    allow_messages:settings.messagePermission==='Todos'?'everyone':'connections',
  };
}

export async function loadProfilePrivacySettings(current:PrivacySettings):Promise<PrivacySettings|null>{
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)return null;

  const {data,error}=await supabase
    .from('profiles')
    .select('profile_visibility,show_location,allow_messages')
    .eq('id',user.id)
    .maybeSingle();

  if(error)throw error;
  if(!data)return null;
  return mergeProfilePrivacy(data as ProfilePrivacyRow,current);
}

export async function syncProfilePrivacySettings(settings:PrivacySettings){
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)return false;

  const {error}=await supabase
    .from('profiles')
    .upsert({id:user.id,...profilePayload(settings),updated_at:new Date().toISOString()},{onConflict:'id'});
  if(error)throw error;
  return true;
}

function profilePatch<K extends PrivacyFieldKey>(key:K,value:PrivacySettings[K]):Record<string,unknown>|null{
  if(key==='profileVisibility')return {profile_visibility:value==='Todos'?'public':'connections'};
  if(key==='locationSharing')return {show_location:value!=='Nunca'};
  if(key==='messagePermission')return {allow_messages:value==='Todos'?'everyone':'connections'};
  return null;
}

export async function saveProfilePrivacySetting<K extends PrivacyFieldKey>(key:K,value:PrivacySettings[K]){
  const patch=profilePatch(key,value);
  if(!patch)return false;

  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)return false;

  const {error}=await supabase
    .from('profiles')
    .upsert({id:user.id,...patch,updated_at:new Date().toISOString()},{onConflict:'id'});
  if(error)throw error;
  return true;
}

export async function addBackendBlock(blockedUserId:string){
  if(!isRealUserId(blockedUserId))return false;
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user||user.id===blockedUserId)return false;

  const {error}=await supabase
    .from('blocks')
    .upsert({blocker_id:user.id,blocked_id:blockedUserId},{onConflict:'blocker_id,blocked_id',ignoreDuplicates:true});
  if(error)throw error;
  return true;
}

export async function removeBackendBlock(blockedUserId:string){
  if(!isRealUserId(blockedUserId))return false;
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)return false;

  const {error}=await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id',user.id)
    .eq('blocked_id',blockedUserId);
  if(error)throw error;
  return true;
}

export async function syncBackendBlocks(blockedUsers:BlockedUser[]){
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)return false;

  const desired=[...new Set(blockedUsers
    .map(item=>item.userId)
    .filter(id=>isRealUserId(id)&&id!==user.id))];
  if(!desired.length)return true;

  const {data,error}=await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id',user.id);
  if(error)throw error;

  const existing=new Set((data||[]).map(row=>String(row.blocked_id||'')).filter(Boolean));
  const toAdd=desired.filter(id=>!existing.has(id));
  if(!toAdd.length)return true;

  const {error:insertError}=await supabase
    .from('blocks')
    .insert(toAdd.map(blockedId=>({blocker_id:user.id,blocked_id:blockedId})));
  if(insertError)throw insertError;
  return true;
}
