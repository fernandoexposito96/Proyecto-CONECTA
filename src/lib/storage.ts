import { syncSettingStorageKey } from './settingsBackend';

type CloudWriter=(key:string,value:unknown)=>void|Promise<void>;
let cloudWriter:CloudWriter|null=null;

export const storageChangeEvent='conecta:storage-change';

export function setCloudStorageWriter(writer:CloudWriter|null){
  cloudWriter=writer;
}

export function loadStored<T>(key:string,fallback:T):T{
  try{
    const raw=window.localStorage.getItem(key);
    if(!raw)return fallback;
    const parsed:unknown=JSON.parse(raw);
    if(parsed===null)return fallback;
    if(key===storageKeys.settingsAccount&&(!parsed||typeof parsed!=='object'||typeof (parsed as Record<string,unknown>).name!=='string'||typeof (parsed as Record<string,unknown>).email!=='string'))return fallback;
    if(Array.isArray(fallback)&&!Array.isArray(parsed))return fallback;
    if(!Array.isArray(fallback)&&(Array.isArray(parsed)||typeof parsed!==typeof fallback))return fallback;
    if(Array.isArray(parsed)){
      if(key===storageKeys.createdPlans&&!parsed.every(item=>item&&typeof item==='object'&&['title','image','time','place','distance','spots','category'].every(field=>typeof item[field]==='string')))return fallback;
      if(key===storageKeys.blockedUsers&&!parsed.every(item=>item&&typeof item==='object'&&typeof item.userId==='string'&&typeof item.name==='string'))return fallback;
      if(key!==storageKeys.createdPlans&&key!==storageKeys.blockedUsers&&!parsed.every(item=>typeof item==='string'))return fallback;
    }
    if(key===storageKeys.chatMessages&&!Object.values(parsed as object).every(item=>Array.isArray(item)&&item.every(message=>typeof message==='string')))return fallback;
    return parsed as T;
  }catch{
    return fallback;
  }
}

export function saveStored<T>(key:string,value:T){
  try{
    window.localStorage.setItem(key,JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(storageChangeEvent,{detail:{key,value}}));
  }catch{}

  void syncSettingStorageKey(key,value).catch(error=>console.warn('CONECTA settings backend sync failed; local state kept',error));

  if(!cloudWriter)return;
  try{
    void Promise.resolve(cloudWriter(key,value)).catch(()=>{});
  }catch{}
}

export const storageKeys={
  createdPlans:'conecta-created-plans-v1',
  connections:'conecta-connections-v1',
  demoConnections:'conecta-demo-connections-v2',
  backendConnections:'conecta-backend-connections-v2',
  chatMessages:'conecta-chat-messages-v1',
  exploreLikes:'conecta-explore-likes-v1',
  storyAdded:'conecta-story-added-v1',
  storyLikes:'conecta-story-likes-v1',
  profileBio:'conecta-profile-bio-v1',
  planFavorites:'conecta-plan-favorites-v1',
  joinedPlans:'conecta-joined-plans-v1',
  organizerFollows:'conecta-organizer-follows-v1',
  settingsAccount:'conecta-settings-account-v1',
  notificationToggles:'conecta-notification-toggles-v1',
  notificationFrequency:'conecta-notification-frequency-v1',
  theme:'conecta-theme',
  language:'conecta-language',
  premiumRequested:'conecta-premium-requested-v1',
  privacySettings:'conecta-privacy-settings-v1',
  blockedUsers:'conecta-blocked-users-v2',
} as const;
