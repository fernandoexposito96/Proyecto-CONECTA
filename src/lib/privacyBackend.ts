import type { BlockedUser, PrivacyFieldKey, PrivacySettings } from '../types';
import { supabase } from './supabase';

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
function isObject(value:unknown):value is Record<string,unknown>{return Boolean(value&&typeof value==='object'&&!Array.isArray(value));}

function privacyToBackend(value:PrivacySettings){return {profileVisibility:value.profileVisibility==='Todos'?'everyone':'connections',plansVisibility:value.planVisibility==='Todos'?'everyone':'connections',location:value.locationSharing==='Nunca'?'never':value.locationSharing==='Siempre'?'always':'while_using',messages:value.messagePermission==='Todos'?'everyone':'connections',requests:value.connectionRequests==='Todos'?'everyone':'nobody'};}
function privacyFromBackend(value:unknown):PrivacySettings|null{
  if(!isObject(value))return null;
  return {profileVisibility:value.profileVisibility==='connections'?'Solo conexiones':'Todos',planVisibility:value.plansVisibility==='connections'?'Solo conexiones':'Todos',locationSharing:value.location==='never'?'Nunca':value.location==='always'?'Siempre':'Al usar la app',messagePermission:value.messages==='everyone'?'Todos':'Solo conexiones',connectionRequests:value.requests==='nobody'?'Nadie':'Todos'};
}
function mergeProfilePrivacy(row:ProfilePrivacyRow,current:PrivacySettings):PrivacySettings{return {...current,profileVisibility:row.profile_visibility==='connections'||row.profile_visibility==='private'?'Solo conexiones':'Todos',locationSharing:row.show_location===false?'Nunca':current.locationSharing==='Nunca'?'Al usar la app':current.locationSharing,messagePermission:row.allow_messages==='everyone'?'Todos':'Solo conexiones'};}
function profilePayload(settings:PrivacySettings){return {profile_visibility:settings.profileVisibility==='Todos'?'public':'connections',show_location:settings.locationSharing!=='Nunca',allow_messages:settings.messagePermission==='Todos'?'everyone':'connections'};}

export async function loadProfilePrivacySettings(current:PrivacySettings):Promise<PrivacySettings|null>{
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)return null;
  const {data:settings,error:settingsError}=await supabase.from('user_settings').select('privacy').eq('user_id',user.id).maybeSingle();
  if(settingsError)throw settingsError;
  const complete=privacyFromBackend(settings?.privacy);if(complete)return complete;
  const {data,error}=await supabase.from('profiles').select('profile_visibility,show_location,allow_messages').eq('id',user.id).maybeSingle();if(error)throw error;if(!data)return null;
  const migrated=mergeProfilePrivacy(data as ProfilePrivacyRow,current);
  await syncProfilePrivacySettings(migrated);
  return migrated;
}

export async function syncProfilePrivacySettings(settings:PrivacySettings){
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)return false;
  const updatedAt=new Date().toISOString();
  const [{error:settingsError},{error:profileError}]=await Promise.all([
    supabase.from('user_settings').upsert({user_id:user.id,privacy:privacyToBackend(settings),updated_at:updatedAt},{onConflict:'user_id'}),
    supabase.from('profiles').upsert({id:user.id,...profilePayload(settings),updated_at:updatedAt},{onConflict:'id'}),
  ]);
  if(settingsError)throw settingsError;if(profileError)throw profileError;return true;
}

function profilePatch<K extends PrivacyFieldKey>(key:K,value:PrivacySettings[K]):Record<string,unknown>|null{if(key==='profileVisibility')return {profile_visibility:value==='Todos'?'public':'connections'};if(key==='locationSharing')return {show_location:value!=='Nunca'};if(key==='messagePermission')return {allow_messages:value==='Todos'?'everyone':'connections'};return null;}
export async function saveProfilePrivacySetting<K extends PrivacyFieldKey>(key:K,value:PrivacySettings[K]){
  const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)return false;
  const {data,error}=await supabase.from('user_settings').select('privacy').eq('user_id',user.id).maybeSingle();if(error)throw error;
  const current=privacyFromBackend(data?.privacy);if(!current)return false;
  const next={...current,[key]:value} as PrivacySettings;
  const patch=profilePatch(key,value);const updatedAt=new Date().toISOString();
  const writes=[supabase.from('user_settings').upsert({user_id:user.id,privacy:privacyToBackend(next),updated_at:updatedAt},{onConflict:'user_id'})];
  if(patch)writes.push(supabase.from('profiles').upsert({id:user.id,...patch,updated_at:updatedAt},{onConflict:'id'}) as typeof writes[number]);
  const results=await Promise.all(writes);for(const result of results)if(result.error)throw result.error;return true;
}

export async function addBackendBlock(blockedUserId:string){if(!isRealUserId(blockedUserId))return false;const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user||user.id===blockedUserId)return false;prepareBlockSyncUser(user.id);const {error}=await supabase.from('blocks').upsert({blocker_id:user.id,blocked_id:blockedUserId},{onConflict:'blocker_id,blocked_id',ignoreDuplicates:true});if(error)throw error;if(lastDesiredBlockIds)lastDesiredBlockIds.add(blockedUserId);return true;}
export async function removeBackendBlock(blockedUserId:string){if(!isRealUserId(blockedUserId))return false;const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)return false;prepareBlockSyncUser(user.id);const {error}=await supabase.from('blocks').delete().eq('blocker_id',user.id).eq('blocked_id',blockedUserId);if(error)throw error;lastDesiredBlockIds?.delete(blockedUserId);return true;}
export async function syncBackendBlocks(blockedUsers:BlockedUser[]){const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)return false;prepareBlockSyncUser(user.id);const desired=new Set(blockedUsers.map(item=>item.userId).filter(id=>isRealUserId(id)&&id!==user.id));const {data,error}=await supabase.from('blocks').select('blocked_id').eq('blocker_id',user.id);if(error)throw error;const existing=new Set((data||[]).map(row=>String(row.blocked_id||'')).filter(Boolean));const toAdd=[...desired].filter(id=>!existing.has(id));const toRemove=lastDesiredBlockIds?[...lastDesiredBlockIds].filter(id=>!desired.has(id)&&existing.has(id)):[];if(toAdd.length){const {error:insertError}=await supabase.from('blocks').insert(toAdd.map(blockedId=>({blocker_id:user.id,blocked_id:blockedId})));if(insertError)throw insertError;}if(toRemove.length){const {error:deleteError}=await supabase.from('blocks').delete().eq('blocker_id',user.id).in('blocked_id',toRemove);if(deleteError)throw deleteError;}lastDesiredBlockIds=new Set(desired);return true;}
