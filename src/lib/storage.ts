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
  try{window.localStorage.setItem(key,JSON.stringify(value));}catch{}
}

export const storageKeys={
  createdPlans:'conecta-created-plans-v1',
  connections:'conecta-connections-v1',
  chatMessages:'conecta-chat-messages-v1',
  exploreLikes:'conecta-explore-likes-v1',
  storyAdded:'conecta-story-added-v1',
  profileBio:'conecta-profile-bio-v1',
  planFavorites:'conecta-plan-favorites-v1',
  joinedPlans:'conecta-joined-plans-v1',
} as const;
