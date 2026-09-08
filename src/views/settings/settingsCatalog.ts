import type { LucideIcon } from 'lucide-react';
import { Bell, CircleHelp, Globe, LockKeyhole, MoonStar, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import type { Language, NotificationFrequency, SettingsScreen, Theme } from '../../types';

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
