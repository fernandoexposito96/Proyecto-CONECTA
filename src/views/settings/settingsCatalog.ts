import type { LucideIcon } from 'lucide-react';
import { BadgeCheck, Bell, CircleHelp, Eye, Globe, LockKeyhole, MapPinned, MessageCircleMore, MoonStar, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import type { Language, NotificationFrequency, PrivacyFieldKey, PrivacySettings, SettingsScreen, Theme } from '../../types';

export type RootSettingsScreen = Extract<SettingsScreen,'account'|'security'|'privacy'|'notifications'|'appearance'|'language'|'help'|'about'>;

export type RootSettingsItem = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  screen: RootSettingsScreen;
};

export function buildRootSettingsItems(theme:Theme,language:Language):RootSettingsItem[]{
  return [
    {icon:UserRound,title:'Mi cuenta',subtitle:'Datos personales y preferencias',screen:'account'},
    {icon:ShieldCheck,title:'Seguridad',subtitle:'Contraseña y verificación',screen:'security'},
    {icon:LockKeyhole,title:'Privacidad',subtitle:'Controla tu información',screen:'privacy'},
    {icon:Bell,title:'Notificaciones',subtitle:'Alertas y recordatorios',screen:'notifications'},
    {icon:MoonStar,title:'Apariencia',subtitle:theme,screen:'appearance'},
    {icon:Globe,title:'Idioma',subtitle:language,screen:'language'},
    {icon:CircleHelp,title:'Centro de ayuda',subtitle:'Guías y soporte',screen:'help'},
    {icon:Sparkles,title:'Sobre CONECTA',subtitle:'Versión 2.0.0',screen:'about'},
  ];
}

export const appearanceOptions = ['Claro','Oscuro','Sistema'] as const satisfies readonly Theme[];
export const languageOptions = ['Español','Català','English'] as const satisfies readonly Language[];

export const notificationFrequencyOptions = [
  ['daily','Resumen diario','Recibe un resumen al final del día'],
  ['weekly','Resumen semanal','Un resumen cada semana'],
  ['important','Solo notificaciones importantes','Solo lo esencial'],
] as const satisfies readonly (readonly [NotificationFrequency,string,string])[];

export const premiumBenefits = [
  ['1','Más visibilidad','Tu perfil llega a más personas'],
  ['2','Planes prioritarios','Destaca tus planes en la app'],
  ['3','Ofertas exclusivas','Accede a promociones especiales'],
  ['4','Filtros avanzados','Encuentra personas afines'],
  ['5','Apoya la comunidad','Ayúdanos a seguir mejorando CONECTA'],
] as const;

export const defaultPrivacy:PrivacySettings={
  profileVisibility:'Todos',
  planVisibility:'Todos',
  locationSharing:'Al usar la app',
  messagePermission:'Solo conexiones',
  connectionRequests:'Todos',
};

type PrivacyFieldConfig<K extends PrivacyFieldKey>={
  icon:LucideIcon;
  title:string;
  subtitle:string;
  options:readonly PrivacySettings[K][];
  description:string;
};

type PrivacyFieldCatalog={
  [K in PrivacyFieldKey]:PrivacyFieldConfig<K>;
};

export const privacyFieldMeta:PrivacyFieldCatalog={
  profileVisibility:{icon:Eye,title:'Visibilidad del perfil',subtitle:'Quién puede ver tu perfil',options:['Todos','Solo conexiones'],description:'Elige quién puede ver tu perfil completo, incluidas fotos, biografía y actividad.'},
  planVisibility:{icon:BadgeCheck,title:'Quién puede ver tus planes',subtitle:'Alcance de tus planes publicados',options:['Todos','Solo conexiones'],description:'Elige quién puede ver los planes que publicas dentro de CONECTA.'},
  locationSharing:{icon:MapPinned,title:'Control de ubicación',subtitle:'Cuándo se muestra tu ubicación',options:['Siempre','Al usar la app','Nunca'],description:'Decide cuándo CONECTA puede usar tu ubicación para planes y personas cercanas.'},
  messagePermission:{icon:MessageCircleMore,title:'Quién puede enviarte mensajes',subtitle:'Filtra quién te puede escribir',options:['Todos','Solo conexiones'],description:'Elige quién puede iniciar una conversación contigo.'},
  connectionRequests:{icon:UserRound,title:'Solicitudes de conexión',subtitle:'Quién puede enviarte solicitudes',options:['Todos','Nadie'],description:'Controla quién puede enviarte solicitudes de conexión.'},
};

export const privacyFieldOrder=['profileVisibility','planVisibility','locationSharing','messagePermission','connectionRequests'] as const satisfies readonly PrivacyFieldKey[];
