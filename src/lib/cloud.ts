import type { BlockedUser, Plan, PrivacySettings } from '../types';
import { accountFromUser, demoAccount } from './identity';
import { defaultPrivacySettings } from './privacy';
import { loadProfilePrivacySettings, syncBackendBlocks, syncProfilePrivacySettings } from './privacyBackend';
import { supabase } from './supabase';

const storagePrefix='conecta-';
const authUserMarker='conecta-auth-user-v1';
const accountKey='conecta-settings-account-v1';
const themeKey='conecta-theme';
const languageKey='conecta-language';
const privacyKey='conecta-privacy-settings-v1';
const blockedUsersKey='conecta-blocked-users-v2';
let pendingState:Record<string,unknown>={};
let flushTimer:number|null=null;
let flushInFlight=false;
let syncGeneration=0;

function localPrototypeState(){
  const state:Record<string,unknown>={};
  for(let index=0;index<window.localStorage.length;index+=1){
    const key=window.localStorage.key(index);
    if(!key?.startsWith(storagePrefix)||key===authUserMarker)continue;
    const raw=window.localStorage.getItem(key);
    if(raw===null)continue;
    try{state[key]=JSON.parse(raw) as unknown}catch{state[key]=raw}
  }
  return state;
}

function clearPrototypeState(){
  const keys:string[]=[];
  for(let index=0;index<window.localStorage.length;index+=1){
    const key=window.localStorage.key(index);
    if(key?.startsWith(storagePrefix)&&key!==authUserMarker)keys.push(key);
  }
  keys.forEach(key=>window.localStorage.removeItem(key));
}

function writePrototypeState(state:Record<string,unknown>){
  for(const [key,value] of Object.entries(state)){
    if(!key.startsWith(storagePrefix)||key===authUserMarker)continue;
    window.localStorage.setItem(key,JSON.stringify(value));
  }
}

function localStateBelongsToUser(state:Record<string,unknown>,userEmail:string){
  const account=state[accountKey];
  if(!account||typeof account!=='object'||Array.isArray(account))return false;
  const email=(account as Record<string,unknown>).email;
  return typeof email==='string'&&email.trim().toLocaleLowerCase('es')===userEmail.trim().toLocaleLowerCase('es');
}

function isPrivacySettings(value:unknown):value is PrivacySettings{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const item=value as Record<string,unknown>;
  return typeof item.profileVisibility==='string'&&typeof item.planVisibility==='string'&&typeof item.locationSharing==='string'&&typeof item.messagePermission==='string'&&typeof item.connectionRequests==='string';
}

function isBlockedUsers(value:unknown):value is BlockedUser[]{
  if(!Array.isArray(value))return false;
  return value.every(item=>Boolean(item&&typeof item==='object'&&typeof (item as BlockedUser).userId==='string'&&typeof (item as BlockedUser).name==='string'));
}

async function mergeRealProfilePrivacy(state:Record<string,unknown>){
  const local=isPrivacySettings(state[privacyKey])?state[privacyKey]:defaultPrivacySettings;
  try{
    const remote=await loadProfilePrivacySettings(local);
    if(remote){
      state[privacyKey]=remote;
    }else{
      await syncProfilePrivacySettings(local);
      state[privacyKey]=local;
    }
  }catch(error){
    console.warn('CONECTA profile privacy sync failed; keeping demo fallback',error);
    state[privacyKey]=local;
  }
  return state;
}

export function resetCloudStateQueue(){
  syncGeneration+=1;
  pendingState={};
  if(flushTimer!==null){
    window.clearTimeout(flushTimer);
    flushTimer=null;
  }
}

export async function hydrateCloudState(expectedUserId?:string){
  const {data:{session},error:sessionError}=await supabase.auth.getSession();
  if(sessionError)throw sessionError;
  if(!session)return false;
  if(expectedUserId&&session.user.id!==expectedUserId)return false;

  const previousUserId=window.localStorage.getItem(authUserMarker);
  const previousLocalState=localPrototypeState();
  const {data,error}=await supabase
    .from('prototype_state')
    .select('state')
    .eq('user_id',session.user.id)
    .maybeSingle();

  if(error)throw error;

  clearPrototypeState();

  if(data?.state&&typeof data.state==='object'&&!Array.isArray(data.state)){
    const state=await mergeRealProfilePrivacy({...data.state as Record<string,unknown>});
    writePrototypeState(state);
    window.localStorage.setItem(authUserMarker,session.user.id);
    if(isBlockedUsers(state[blockedUsersKey]))void syncBackendBlocks(state[blockedUsersKey]).catch(error=>console.warn('CONECTA block sync failed; demo fallback kept',error));
    return true;
  }

  const sessionEmail=session.user.email||demoAccount.email;
  const canMigrateLocal=previousUserId===session.user.id||(!previousUserId&&localStateBelongsToUser(previousLocalState,sessionEmail));
  const state:Record<string,unknown>=canMigrateLocal?{...previousLocalState}:{};
  if(!canMigrateLocal){
    if(themeKey in previousLocalState)state[themeKey]=previousLocalState[themeKey];
    if(languageKey in previousLocalState)state[languageKey]=previousLocalState[languageKey];
  }
  state[accountKey]=accountFromUser(session.user,canMigrateLocal?(previousLocalState[accountKey] as {name:string;email:string}|undefined):undefined);
  await mergeRealProfilePrivacy(state);

  writePrototypeState(state);
  window.localStorage.setItem(authUserMarker,session.user.id);
  if(isBlockedUsers(state[blockedUsersKey]))void syncBackendBlocks(state[blockedUsersKey]).catch(error=>console.warn('CONECTA block sync failed; demo fallback kept',error));

  const {error:upsertError}=await supabase
    .from('prototype_state')
    .upsert({user_id:session.user.id,state,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(upsertError)throw upsertError;
  return true;
}

function scheduleFlush(delay=300){
  if(flushTimer!==null)window.clearTimeout(flushTimer);
  flushTimer=window.setTimeout(()=>{void flushCloudState()},delay);
}

async function flushCloudState(){
  flushTimer=null;
  if(flushInFlight){
    if(Object.keys(pendingState).length)scheduleFlush(300);
    return;
  }

  const patch=pendingState;
  const generation=syncGeneration;
  pendingState={};
  if(!Object.keys(patch).length)return;

  flushInFlight=true;
  try{
    const {data:{session},error:sessionError}=await supabase.auth.getSession();
    if(sessionError)throw sessionError;
    if(!session||generation!==syncGeneration)return;

    const {data,error:readError}=await supabase
      .from('prototype_state')
      .select('state')
      .eq('user_id',session.user.id)
      .maybeSingle();
    if(readError)throw readError;
    if(generation!==syncGeneration)return;

    const current=data?.state&&typeof data.state==='object'&&!Array.isArray(data.state)
      ? data.state as Record<string,unknown>
      : {};

    const {error}=await supabase
      .from('prototype_state')
      .upsert({
        user_id:session.user.id,
        state:{...current,...patch},
        updated_at:new Date().toISOString(),
      },{onConflict:'user_id'});

    if(error)throw error;
  }catch(error){
    if(generation!==syncGeneration)return;
    pendingState={...patch,...pendingState};
    console.warn('CONECTA cloud state sync failed; retry scheduled',error);
    scheduleFlush(1500);
  }finally{
    flushInFlight=false;
    if(generation===syncGeneration&&Object.keys(pendingState).length&&flushTimer===null)scheduleFlush(300);
  }
}

export function queueCloudStateSave(key:string,value:unknown){
  if(!key.startsWith(storagePrefix)||key===authUserMarker)return;
  pendingState[key]=value;
  if(key===privacyKey&&isPrivacySettings(value)){
    void syncProfilePrivacySettings(value).catch(error=>console.warn('CONECTA profile privacy write failed; demo state kept',error));
  }
  if(key===blockedUsersKey&&isBlockedUsers(value)){
    void syncBackendBlocks(value).catch(error=>console.warn('CONECTA block write failed; demo state kept',error));
  }
  scheduleFlush(300);
}

type PrototypePlanRow={
  id:string;
  creator_id:string;
  plan:unknown;
  created_at:string;
};

function isPlan(value:unknown):value is Plan{
  return Boolean(
    value&&typeof value==='object'&&
    'title' in value&&typeof (value as Plan).title==='string'&&
    'image' in value&&typeof (value as Plan).image==='string'
  );
}

export async function fetchSharedPlans():Promise<Plan[]>{
  const {data,error}=await supabase
    .from('prototype_plans')
    .select('id,creator_id,plan,created_at')
    .order('created_at',{ascending:false})
    .limit(200);

  if(error)throw error;
  return ((data||[]) as PrototypePlanRow[])
    .filter(row=>isPlan(row.plan))
    .map(row=>row.plan as Plan);
}

export async function createSharedPlan(plan:Plan){
  const {data:{session},error:sessionError}=await supabase.auth.getSession();
  if(sessionError)throw sessionError;
  if(!session)throw new Error('Necesitas iniciar sesión para publicar un plan.');

  const {error}=await supabase
    .from('prototype_plans')
    .insert({creator_id:session.user.id,plan});
  if(error)throw error;
}
