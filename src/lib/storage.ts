import { syncSettingStorageKey } from './settingsBackend';

type CloudWriter=(key:string,value:unknown)=>void|Promise<void>;
let cloudWriter:CloudWriter|null=null;
const pendingCloudWrites=new Map<string,unknown>();

export const storageChangeEvent='conecta:storage-change';
const backendIdPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function queueCloudWrite(key:string,value:unknown){
  pendingCloudWrites.set(key,value);
}

function sendCloudWrite(writer:CloudWriter,key:string,value:unknown){
  try{
    void Promise.resolve(writer(key,value)).then(()=>{
      if(pendingCloudWrites.get(key)===value)pendingCloudWrites.delete(key);
    }).catch(()=>queueCloudWrite(key,value));
  }catch{queueCloudWrite(key,value);}
}

function flushPendingCloudWrites(){
  const writer=cloudWriter;
  if(!writer)return;
  for(const [key,value] of pendingCloudWrites)sendCloudWrite(writer,key,value);
}

export function setCloudStorageWriter(writer:CloudWriter|null){
  cloudWriter=writer;
  if(writer)flushPendingCloudWrites();
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
      if(key===storageKeys.connections)return parsed.filter(item=>typeof item==='string'&&!backendIdPattern.test(item)) as T;
    }
    if(key===storageKeys.chatMessages&&!Object.values(parsed as object).every(item=>Array.isArray(item)&&item.every(message=>typeof message==='string')))return fallback;
    return parsed as T;
  }catch{
    return fallback;
  }
}

export function saveStored<T>(key:string,value:T){
  let persisted=false;
  try{
    window.localStorage.setItem(key,JSON.stringify(value));
    persisted=true;
    window.dispatchEvent(new CustomEvent(storageChangeEvent,{detail:{key,value}}));
  }catch(error){
    console.warn('CONECTA local state could not be persisted; remote sync skipped',error);
  }

  // A failed local write must never be acknowledged remotely. When cloud
  // hydration is temporarily unavailable, keep the latest persisted edit in a
  // session outbox and replay it as soon as the writer becomes available.
  if(!persisted)return;
  if(!cloudWriter){
    queueCloudWrite(key,value);
    return;
  }

  void syncSettingStorageKey(key,value).catch(error=>console.warn('CONECTA settings backend sync failed; local state kept',error));
  sendCloudWrite(cloudWriter,key,value);
}

export const storageKeys={
  createdPlans:'conecta-created-plans-v1',
  connections:'conecta-connections-v1',
  demoConnections:'conecta-demo-connections-v2',
  backendConnections:'conecta-backend-connections-v2',
  chatMessages:'conecta-chat-messages-v1',
  exploreLikes:'conecta-explore-likes-v1',
  exploreDislikes:'conecta-explore-dislikes-v1',
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
