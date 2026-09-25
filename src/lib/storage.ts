import { syncSettingStorageKey } from './settingsBackend';

type CloudWriter=(key:string,value:unknown)=>void|Promise<void>;
let cloudWriter:CloudWriter|null=null;
type PendingCloudWrite={owner:string;key:string;value:unknown};
const pendingCloudWrites=new Map<string,PendingCloudWrite>();
const cloudOutboxKey='conecta-cloud-outbox-v1';

export const storageChangeEvent='conecta:storage-change';
const backendIdPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function localCloudOwner(){
  try{return window.localStorage.getItem('conecta-auth-user-v1')}catch{return null;}
}

function pendingId(owner:string,key:string){return JSON.stringify([owner,key]);}

function persistCloudOutbox(){
  try{
    const values=[...pendingCloudWrites.values()];
    if(values.length)window.localStorage.setItem(cloudOutboxKey,JSON.stringify(values));
    else window.localStorage.removeItem(cloudOutboxKey);
  }catch{}
}

function restoreCloudOutbox(){
  try{
    const raw=window.localStorage.getItem(cloudOutboxKey);
    if(!raw)return;
    const parsed:unknown=JSON.parse(raw);
    if(!Array.isArray(parsed))return;
    for(const item of parsed){
      if(!item||typeof item!=='object')continue;
      const pending=item as Partial<PendingCloudWrite>;
      if(typeof pending.owner!=='string'||typeof pending.key!=='string')continue;
      pendingCloudWrites.set(pendingId(pending.owner,pending.key),{owner:pending.owner,key:pending.key,value:pending.value});
    }
  }catch{}
}
restoreCloudOutbox();

function queueCloudWrite(key:string,value:unknown){
  const owner=localCloudOwner();
  if(!owner)return null;
  const pending={owner,key,value};
  pendingCloudWrites.set(pendingId(owner,key),pending);
  persistCloudOutbox();
  return pending;
}

function sendCloudWrite(writer:CloudWriter,pending:PendingCloudWrite){
  if(writer!==cloudWriter||localCloudOwner()!==pending.owner)return;
  const id=pendingId(pending.owner,pending.key);
  try{
    void Promise.all([
      syncSettingStorageKey(pending.key,pending.value),
      Promise.resolve(writer(pending.key,pending.value)),
    ]).then(()=>{
      if(pendingCloudWrites.get(id)===pending){pendingCloudWrites.delete(id);persistCloudOutbox();}
    }).catch(()=>{});
  }catch{}
}

function flushPendingCloudWrites(){
  const writer=cloudWriter;
  if(!writer)return;
  const owner=localCloudOwner();
  for(const pending of pendingCloudWrites.values())if(pending.owner===owner)sendCloudWrite(writer,pending);
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
    if(key===storageKeys.chatMessages&&(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||!Object.values(parsed as object).every(item=>Array.isArray(item)&&item.every(message=>typeof message==='string'))))return fallback;
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

  if(!persisted)return;
  const pending=queueCloudWrite(key,value);
  if(cloudWriter&&pending)sendCloudWrite(cloudWriter,pending);
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
  accent:'conecta-accent-v1',
  largeText:'conecta-large-text-v1',
  highContrast:'conecta-high-contrast-v1',
  compactView:'conecta-compact-view-v1',
  reducedMotion:'conecta-reduced-motion-v1',
  language:'conecta-language',
  premiumRequested:'conecta-premium-requested-v1',
  privacySettings:'conecta-privacy-settings-v1',
  blockedUsers:'conecta-blocked-users-v2',
} as const;
