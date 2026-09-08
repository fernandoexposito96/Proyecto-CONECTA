import type { PrivacyFieldKey, PrivacySettings } from '../types';
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

export async function loadProfilePrivacySettings(current:PrivacySettings):Promise<PrivacySettings|null>{
  const {data:{user}}=await supabase.auth.getUser();
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

function profilePatch<K extends PrivacyFieldKey>(key:K,value:PrivacySettings[K]):Record<string,unknown>|null{
  if(key==='profileVisibility')return {profile_visibility:value==='Todos'?'public':'connections'};
  if(key==='locationSharing')return {show_location:value!=='Nunca'};
  if(key==='messagePermission')return {allow_messages:value==='Todos'?'everyone':'connections'};
  return null;
}

export async function saveProfilePrivacySetting<K extends PrivacyFieldKey>(key:K,value:PrivacySettings[K]){
  const patch=profilePatch(key,value);
  if(!patch)return false;

  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return false;

  const {error}=await supabase
    .from('profiles')
    .upsert({id:user.id,...patch,updated_at:new Date().toISOString()},{onConflict:'id'});
  if(error)throw error;
  return true;
}

export async function addBackendBlock(blockedUserId:string){
  if(!isRealUserId(blockedUserId))return false;
  const {data:{user}}=await supabase.auth.getUser();
  if(!user||user.id===blockedUserId)return false;

  const {error}=await supabase
    .from('blocks')
    .upsert({blocker_id:user.id,blocked_id:blockedUserId},{onConflict:'blocker_id,blocked_id',ignoreDuplicates:true});
  if(error)throw error;
  return true;
}

export async function removeBackendBlock(blockedUserId:string){
  if(!isRealUserId(blockedUserId))return false;
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return false;

  const {error}=await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id',user.id)
    .eq('blocked_id',blockedUserId);
  if(error)throw error;
  return true;
}
