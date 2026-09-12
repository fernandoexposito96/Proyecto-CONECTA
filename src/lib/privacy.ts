import type { BlockedUser, PrivacySettings } from '../types';
import { loadStored, storageKeys } from './storage';

export const defaultPrivacySettings:PrivacySettings={
  profileVisibility:'Todos',
  planVisibility:'Todos',
  locationSharing:'Al usar la app',
  messagePermission:'Solo conexiones',
  connectionRequests:'Todos',
};

export function loadPrivacySettings():PrivacySettings{
  return loadStored<PrivacySettings>(storageKeys.privacySettings,defaultPrivacySettings);
}

export function loadBlockedUsers():BlockedUser[]{
  const stored=loadStored<Array<BlockedUser|string>>(storageKeys.blockedUsers,[]);
  return stored.flatMap((item,index)=>{
    if(typeof item==='string')return [{userId:`legacy-${index}-${item}`,name:item}];
    if(item&&typeof item.userId==='string'&&typeof item.name==='string')return [item];
    return [];
  });
}

export function blockedNames():Set<string>{
  return new Set(loadBlockedUsers().map(user=>user.name));
}

export function blockedUserIds():Set<string>{
  return new Set(loadBlockedUsers().filter(user=>!user.userId.startsWith('legacy-')).map(user=>user.userId));
}

export function blockedLegacyNames():Set<string>{
  return new Set(loadBlockedUsers().filter(user=>user.userId.startsWith('legacy-')).map(user=>user.name));
}

export function canUseLocation(settings:PrivacySettings=loadPrivacySettings()){
  return settings.locationSharing!=='Nunca';
}

export function distanceCopy(distance:string,settings:PrivacySettings=loadPrivacySettings()){
  return canUseLocation(settings)?`A ${distance} de ti`:'Ubicación privada';
}

export function canShowPublicProfile(settings:PrivacySettings=loadPrivacySettings()){
  return settings.profileVisibility==='Todos';
}

export function planAudience(settings:PrivacySettings=loadPrivacySettings()){
  return settings.planVisibility;
}
