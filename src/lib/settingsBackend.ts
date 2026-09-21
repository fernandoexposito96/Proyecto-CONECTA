import type { AccountSettings, Language, NotificationFrequency, PrivacySettings, Theme, ToggleKey } from '../types';
import { supabase } from './supabase';

export type NotificationToggles=Record<ToggleKey,boolean>;

type BackendSettings={
  theme?:Theme;
  language?:Language;
  notifications?:NotificationToggles;
  frequency?:NotificationFrequency;
  privacy?:PrivacySettings;
};

const themeToBackend:Record<Theme,'light'|'dark'|'system'>={Claro:'light',Oscuro:'dark',Sistema:'system'};
const backendToTheme:Record<'light'|'dark'|'system',Theme>={light:'Claro',dark:'Oscuro',system:'Sistema'};
const languageToBackend:Record<Language,'es'|'ca'|'en'|'fr'|'de'|'it'|'pt'>={Español:'es',Català:'ca',English:'en',Français:'fr',Deutsch:'de',Italiano:'it',Português:'pt'};
const backendToLanguage:Record<'es'|'ca'|'en'|'fr'|'de'|'it'|'pt',Language>={es:'Español',ca:'Català',en:'English',fr:'Français',de:'Deutsch',it:'Italiano',pt:'Português'};

const notificationTogglesKey='conecta-notification-toggles-v1';
const notificationFrequencyKey='conecta-notification-frequency-v1';
const themeKey='conecta-theme';
const languageKey='conecta-language';
const privacyKey='conecta-privacy-settings-v1';

async function currentUser(){
  const {data:{user},error}=await supabase.auth.getUser();
  if(error)throw error;
  return user;
}

function isObject(value:unknown):value is Record<string,unknown>{
  return Boolean(value&&typeof value==='object'&&!Array.isArray(value));
}

function isNotificationToggles(value:unknown):value is NotificationToggles{
  if(!isObject(value))return false;
  return ['messages','requests','planUpdates','reminders','news','offers'].every(key=>typeof value[key]==='boolean');
}

function isFrequency(value:unknown):value is NotificationFrequency{
  return value==='daily'||value==='weekly'||value==='important';
}

function isTheme(value:unknown):value is Theme{
  return value==='Claro'||value==='Oscuro'||value==='Sistema';
}

function isLanguage(value:unknown):value is Language{
  return value==='Español'||value==='Català'||value==='English'||value==='Français'||value==='Deutsch'||value==='Italiano'||value==='Português';
}

function isBackendTheme(value:unknown):value is 'light'|'dark'|'system'{
  return value==='light'||value==='dark'||value==='system';
}

function isBackendLanguage(value:unknown):value is 'es'|'ca'|'en'|'fr'|'de'|'it'|'pt'{
  return value==='es'||value==='ca'||value==='en'||value==='fr'||value==='de'||value==='it'||value==='pt';
}

function isPrivacy(value:unknown):value is PrivacySettings{
  if(!isObject(value))return false;
  return (value.profileVisibility==='Todos'||value.profileVisibility==='Solo conexiones')
    &&(value.planVisibility==='Todos'||value.planVisibility==='Solo conexiones')
    &&(value.locationSharing==='Siempre'||value.locationSharing==='Al usar la app'||value.locationSharing==='Nunca')
    &&(value.messagePermission==='Todos'||value.messagePermission==='Solo conexiones')
    &&(value.connectionRequests==='Todos'||value.connectionRequests==='Nadie');
}

function privacyToBackend(value:PrivacySettings){
  return {
    profileVisibility:value.profileVisibility==='Todos'?'everyone':'connections',
    plansVisibility:value.planVisibility==='Todos'?'everyone':'connections',
    location:value.locationSharing==='Nunca'?'never':value.locationSharing==='Siempre'?'always':'while_using',
    messages:value.messagePermission==='Todos'?'everyone':'connections',
    requests:value.connectionRequests==='Todos'?'everyone':'nobody',
  };
}

export function privacyFromBackend(value:unknown):PrivacySettings|undefined{
  if(!isObject(value))return undefined;
  const read=(key:string,legacyKey?:string)=>value[key]??(legacyKey?value[legacyKey]:undefined);
  const profile=read('profileVisibility','profile_visibility');
  const plans=read('plansVisibility','planVisibility');
  const location=read('location','locationSharing');
  const messages=read('messages','messagePermission');
  const requests=read('requests','connectionRequests');
  if(!['everyone','connections'].includes(String(profile)))return undefined;
  if(!['everyone','connections'].includes(String(plans)))return undefined;
  if(!['never','always','while_using'].includes(String(location)))return undefined;
  if(!['everyone','connections'].includes(String(messages)))return undefined;
  if(!['everyone','nobody'].includes(String(requests)))return undefined;
  return {
    profileVisibility:profile==='connections'?'Solo conexiones':'Todos',
    planVisibility:plans==='connections'?'Solo conexiones':'Todos',
    locationSharing:location==='never'?'Nunca':location==='always'?'Siempre':'Al usar la app',
    messagePermission:messages==='everyone'?'Todos':'Solo conexiones',
    connectionRequests:requests==='nobody'?'Nadie':'Todos',
  };
}

async function currentStorageUser(expectedUserId:string){
  const user=await currentUser();
  try{
    return user?.id===expectedUserId&&window.localStorage.getItem('conecta-auth-user-v1')===expectedUserId?user:null;
  }catch{return null;}
}

async function upsertUserSettings(patch:Record<string,unknown>,expectedUserId:string){
  const user=await currentStorageUser(expectedUserId);
  if(!user)return false;
  const {error}=await supabase
    .from('user_settings')
    .upsert({user_id:user.id,...patch,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(error)throw error;
  return true;
}

function loadLocalJson(key:string):unknown{
  try{
    const raw=window.localStorage.getItem(key);
    return raw?JSON.parse(raw):undefined;
  }catch{
    return undefined;
  }
}

async function syncNotifications(expectedUserId:string){
  const toggles=loadLocalJson(notificationTogglesKey);
  const frequency=loadLocalJson(notificationFrequencyKey);
  if(!isNotificationToggles(toggles))return false;
  const safeFrequency=isFrequency(frequency)?frequency:'daily';
  const user=await currentStorageUser(expectedUserId);
  if(!user)return false;

  const [{error:settingsError},{error:preferencesError}]=await Promise.all([
    supabase.from('user_settings').upsert({
      user_id:user.id,
      notifications:{...toggles,frequency:safeFrequency},
      updated_at:new Date().toISOString(),
    },{onConflict:'user_id'}),
    supabase.from('notification_preferences').upsert({
      user_id:user.id,
      messages:toggles.messages,
      connections:toggles.requests,
      plans:toggles.planUpdates||toggles.reminders,
      events:toggles.planUpdates||toggles.reminders,
      communities:toggles.news,
      updated_at:new Date().toISOString(),
    },{onConflict:'user_id'}),
  ]);
  if(settingsError)throw settingsError;
  if(preferencesError)throw preferencesError;
  return true;
}

export async function saveAccountIdentity(account:AccountSettings){
  const cleanName=account.name.trim();
  if(!cleanName)return false;
  const user=await currentUser();
  if(!user)return false;

  const {error:authError}=await supabase.auth.updateUser({data:{display_name:cleanName,full_name:cleanName}});
  if(authError)throw authError;
  const {error:profileError}=await supabase
    .from('profiles')
    .upsert({id:user.id,display_name:cleanName,updated_at:new Date().toISOString()},{onConflict:'id'});
  if(profileError)throw profileError;
  return true;
}

export async function syncSettingStorageKey(key:string,value:unknown){
  let expectedUserId:string|null;
  try{expectedUserId=window.localStorage.getItem('conecta-auth-user-v1')}catch{return false;}
  if(!expectedUserId)return false;
  if(key===themeKey&&isTheme(value))return upsertUserSettings({appearance:themeToBackend[value]},expectedUserId);
  if(key===languageKey&&isLanguage(value))return upsertUserSettings({language:languageToBackend[value]},expectedUserId);
  if(key===privacyKey&&isPrivacy(value))return upsertUserSettings({privacy:privacyToBackend(value)},expectedUserId);
  if((key===notificationTogglesKey&&isNotificationToggles(value))||(key===notificationFrequencyKey&&isFrequency(value)))return syncNotifications(expectedUserId);
  return false;
}

export async function loadBackendSettings():Promise<BackendSettings|null>{
  const user=await currentUser();
  if(!user)return null;
  const {data,error}=await supabase
    .from('user_settings')
    .select('notifications,privacy,appearance,language')
    .eq('user_id',user.id)
    .maybeSingle();
  if(error)throw error;
  if(!data)return null;

  const result:BackendSettings={};
  const appearance:unknown=data.appearance;
  const language:unknown=data.language;
  const notifications:unknown=data.notifications;
  const privacy:unknown=data.privacy;

  if(isBackendTheme(appearance))result.theme=backendToTheme[appearance];
  if(isBackendLanguage(language))result.language=backendToLanguage[language];
  if(isObject(notifications)){
    const storedFrequency=notifications['frequency'];
    if(isNotificationToggles(notifications))result.notifications=notifications;
    if(isFrequency(storedFrequency))result.frequency=storedFrequency;
  }
  result.privacy=privacyFromBackend(privacy);
  return result;
}

export async function submitSupportRequest(kind:'help'|'improvement',subject:string,message:string,contactEmail:string){
  const cleanSubject=subject.trim();
  const cleanMessage=message.trim();
  if(cleanSubject.length<3||cleanMessage.length<10)throw new Error('Completa el asunto y escribe al menos 10 caracteres en el mensaje.');
  const user=await currentUser();
  if(!user)throw new Error('Necesitas iniciar sesión para contactar con soporte.');
  const {error}=await supabase.from('support_requests').insert({
    user_id:user.id,
    request_type:kind,
    category:'app',
    subject:cleanSubject.slice(0,120),
    message:cleanMessage.slice(0,4000),
    contact_email:contactEmail||user.email||null,
    metadata:{source:'conecta-settings',version:'2.0.0'},
  });
  if(error)throw error;
  return true;
}
