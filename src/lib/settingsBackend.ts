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
const languageToBackend:Record<Language,'es'|'ca'|'en'>={Español:'es',Català:'ca',English:'en'};
const backendToLanguage:Record<'es'|'ca'|'en',Language>={es:'Español',ca:'Català',en:'English'};

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

export async function saveNotificationSettings(toggles:NotificationToggles,frequency:NotificationFrequency){
  const user=await currentUser();
  if(!user)return false;

  const notifications={...toggles,frequency};
  const [{error:settingsError},{error:preferenceError}]=await Promise.all([
    supabase.from('user_settings').upsert({user_id:user.id,notifications,updated_at:new Date().toISOString()},{onConflict:'user_id'}),
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
  if(preferenceError)throw preferenceError;
  return true;
}

export const saveThemeSetting=(theme:Theme)=>upsertUserSettings({appearance:themeToBackend[theme]});
export const saveLanguageSetting=(language:Language)=>upsertUserSettings({language:languageToBackend[language]});
export const savePrivacySettingsBackend=(privacy:PrivacySettings)=>upsertUserSettings({privacy:privacyToBackend(privacy)});

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
