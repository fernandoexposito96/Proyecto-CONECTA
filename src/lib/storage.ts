type CloudWriter=(key:string,value:unknown)=>void|Promise<void>;
let cloudWriter:CloudWriter|null=null;

export function setCloudStorageWriter(writer:CloudWriter|null){
  cloudWriter=writer;
}

export function loadStored<T>(key:string,fallback:T):T{
  try{
    const raw=window.localStorage.getItem(key);
    if(!raw)return fallback;
    return JSON.parse(raw) as T;
  }catch{
    return fallback;
  }
}

export function saveStored<T>(key:string,value:T){
  try{
    window.localStorage.setItem(key,JSON.stringify(value));
  }catch{}

  if(!cloudWriter)return;
  try{
    void Promise.resolve(cloudWriter(key,value)).catch(()=>{});
  }catch{}
}

export const storageKeys={
  createdPlans:'conecta-created-plans-v1',
  connections:'conecta-connections-v1',
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
