import type { Language, NotificationFrequency, PrivacySettings, Theme, ToggleKey } from '../types';
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
const languageToBackend:Record<Language,'es'|'ca'|'en'>={Español:'es',Català:'ca',English:'en'};
const backendToLanguage:Record<'es'|'ca'|'en',Language>={es:'Español',ca:'Català',en:'English'};

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
  return value==='Español'||value==='Català'||value==='English';
}

function isPrivacy(value:unknown):value is PrivacySettings{
  if(!isObject(value))return false;
  return typeof value.profileVisibility==='string'&&typeof value.planVisibility==='string'&&typeof value.locationSharing==='string'&&typeof value.messagePermission==='string'&&typeof value.connectionRequests==='string';
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

function privacyFromBackend(value:unknown):PrivacySettings|undefined{
  if(!isObject(value))return undefined;
  const profileVisibility=value.profileVisibility==='connections'?'Solo conexiones':'Todos';
  const planVisibility=value.plansVisibility==='connections'?'Solo conexiones':'Todos';
  const locationSharing=value.location==='never'?'Nunca':value.location==='always'?'Siempre':'Al usar la app';
  const messagePermission=value.messages==='everyone'?'Todos':'Solo conexiones';
  const connectionRequests=value.requests==='nobody'?'Nadie':'Todos';
  return {profileVisibility,planVisibility,locationSharing,messagePermission,connectionRequests};
}

async function upsertUserSettings(patch:Record<string,unknown>){
  const user=await currentUser();
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

async function syncNotificationsToUserSettings(){
  const toggles=loadLocalJson(notificationTogglesKey);
  const frequency=loadLocalJson(notificationFrequencyKey);
  if(!isNotificationToggles(toggles))return false;
  const safeFrequency=isFrequency(frequency)?frequency:'daily';
  return upsertUserSettings({notifications:{...toggles,frequency:safeFrequency}});
}

export async function syncSettingStorageKey(key:string,value:unknown){
  if(key===themeKey&&isTheme(value))return upsertUserSettings({appearance:themeToBackend[value]});
  if(key===languageKey&&isLanguage(value))return upsertUserSettings({language:languageToBackend[value]});
  if(key===privacyKey&&isPrivacy(value))return upsertUserSettings({privacy:privacyToBackend(value)});
  if((key===notificationTogglesKey&&isNotificationToggles(value))||(key===notificationFrequencyKey&&isFrequency(value)))return syncNotificationsToUserSettings();
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
  if(data.appearance==='light'||data.appearance==='dark'||data.appearance==='system')result.theme=backendToTheme[data.appearance];
  if(data.language==='es'||data.language==='ca'||data.language==='en')result.language=backendToLanguage[data.language];
  if(isObject(data.notifications)){
    if(isNotificationToggles(data.notifications))result.notifications=data.notifications;
    if(isFrequency(data.notifications.frequency))result.frequency=data.notifications.frequency;
  }
  result.privacy=privacyFromBackend(data.privacy);
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
