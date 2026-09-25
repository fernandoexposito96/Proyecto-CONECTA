import type { BlockedUser, PrivacyFieldKey, PrivacySettings } from '../types';
import { supabase } from './supabase';
import { privacyFromBackend } from './settingsBackend';

type ProfilePrivacyRow={
  profile_visibility:string|null;
  show_location:boolean|null;
  allow_messages:string|null;
};

const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let blockSyncUserId:string|null=null;
let lastDesiredBlockIds:Set<string>|null=null;

export function isRealUserId(value:string){return uuidPattern.test(value);}
function prepareBlockSyncUser(userId:string){if(blockSyncUserId===userId)return;blockSyncUserId=userId;lastDesiredBlockIds=null;}

function privacyToBackend(value:PrivacySettings){return {profileVisibility:value.profileVisibility==='Todos'?'everyone':'connections',plansVisibility:value.planVisibility==='Todos'?'everyone':'connections',location:value.locationSharing==='Nunca'?'never':value.locationSharing==='Siempre'?'always':'while_using',messages:value.messagePermission==='Todos'?'everyone':'connections',requests:value.connectionRequests==='Todos'?'everyone':'nobody'};}
function mergeProfilePrivacy(row:ProfilePrivacyRow,current:PrivacySettings):PrivacySettings{return {...current,profileVisibility:row.profile_visibility==='connections'||row.profile_visibility==='private'?'Solo conexiones':'Todos',locationSharing:row.show_location===false?'Nunca':current.locationSharing==='Nunca'?'Al usar la app':current.locationSharing,messagePermission:row.allow_messages==='everyone'?'Todos':'Solo conexiones'};}

async function persistPrivacy(settings:PrivacySettings){
  const {error}=await supabase.rpc('save_privacy_settings',{p_privacy:privacyToBackend(settings)});
  if(error)throw error;
}

export async function loadProfilePrivacySettings(current:PrivacySettings):Promise<PrivacySettings|null>{
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)return null;
  const {data:settings,error:settingsError}=await supabase.from('user_settings').select('privacy').eq('user_id',user.id).maybeSingle();
  if(settingsError)throw settingsError;
  const complete=privacyFromBackend(settings?.privacy);if(complete)return complete;
  const {data,error}=await supabase.from('profiles').select('profile_visibility,show_location,allow_messages').eq('id',user.id).maybeSingle();if(error)throw error;if(!data)return null;
  const migrated=mergeProfilePrivacy(data as ProfilePrivacyRow,current);
  await persistPrivacy(migrated);
  return migrated;
}

export async function syncProfilePrivacySettings(settings:PrivacySettings){
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)return false;
  await persistPrivacy(settings);
  return true;
}

export async function saveProfilePrivacySetting<K extends PrivacyFieldKey>(key:K,value:PrivacySettings[K],fallback:PrivacySettings){
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)return false;
  const {data,error}=await supabase.from('user_settings').select('privacy').eq('user_id',user.id).maybeSingle();if(error)throw error;
  const current=privacyFromBackend(data?.privacy)||fallback;
  const next={...current,[key]:value} as PrivacySettings;
  await persistPrivacy(next);
  return true;
}

export async function addBackendBlock(blockedUserId:string){if(!isRealUserId(blockedUserId))return false;const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user||user.id===blockedUserId)return false;prepareBlockSyncUser(user.id);const {error}=await supabase.from('blocks').upsert({blocker_id:user.id,blocked_id:blockedUserId},{onConflict:'blocker_id,blocked_id',ignoreDuplicates:true});if(error)throw error;if(lastDesiredBlockIds)lastDesiredBlockIds.add(blockedUserId);return true;}
export async function removeBackendBlock(blockedUserId:string){if(!isRealUserId(blockedUserId))return false;const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)return false;prepareBlockSyncUser(user.id);const {error}=await supabase.from('blocks').delete().eq('blocker_id',user.id).eq('blocked_id',blockedUserId);if(error)throw error;lastDesiredBlockIds?.delete(blockedUserId);return true;}
export async function syncBackendBlocks(blockedUsers:BlockedUser[]){const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)return false;prepareBlockSyncUser(user.id);const desired=new Set(blockedUsers.map(item=>item.userId).filter(id=>isRealUserId(id)&&id!==user.id));const {data,error}=await supabase.from('blocks').select('blocked_id').eq('blocker_id',user.id);if(error)throw error;const existing=new Set((data||[]).map(row=>String(row.blocked_id||'')).filter(Boolean));const toAdd=[...desired].filter(id=>!existing.has(id));const toRemove=lastDesiredBlockIds?[...lastDesiredBlockIds].filter(id=>!desired.has(id)&&existing.has(id)):[];if(toAdd.length){const {error:insertError}=await supabase.from('blocks').insert(toAdd.map(blockedId=>({blocker_id:user.id,blocked_id:blockedId})));if(insertError)throw insertError;}if(toRemove.length){const {error:deleteError}=await supabase.from('blocks').delete().eq('blocker_id',user.id).in('blocked_id',toRemove);if(deleteError)throw deleteError;}lastDesiredBlockIds=new Set(desired);return true;}
