import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, CircleHelp, Database, Download, Eye, Globe, LockKeyhole, LogOut, Mail, MapPinned, MessageCircleMore, MoonStar, ShieldCheck, Smartphone, Sparkles, UserRound, UserX, BadgeCheck } from 'lucide-react';
import { accountFromUser, demoAccount } from '../lib/identity';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import { supabase } from '../lib/supabase';
import type { AccountSettings, ActionItem, HelpItem, Language, NotificationFrequency, SettingsScreen, Theme, ToggleKey } from '../types';

const defaultToggles:Record<ToggleKey,boolean>={messages:true,requests:true,planUpdates:true,reminders:true,news:true,offers:true};

function Header({title,subtitle,onBack}:{title:string;subtitle:string;onBack?:()=>void}){return <div className="settings-header">{onBack?<button className="settings-back" onClick={onBack} aria-label="Volver"><ChevronLeft/></button>:<span className="settings-back placeholder"/>}<div className="settings-header-copy"><h1>{title}</h1><p>{subtitle}</p></div><span className="settings-back placeholder"/></div>}
function Row({icon:Icon,title,subtitle,onClick,danger=false}:{icon:any;title:string;subtitle:string;onClick?:()=>void;danger?:boolean}){return <button className={`settings-row ${danger?'is-danger':''}`} onClick={onClick}><span className="settings-row-icon"><Icon/></span><span className="settings-row-copy"><strong>{title}</strong><small>{subtitle}</small></span><ChevronRight/></button>}
function ToggleRow({label,sublabel,checked,onToggle}:{label:string;sublabel:string;checked:boolean;onToggle:()=>void}){return <div className="settings-toggle-row"><div className="settings-toggle-copy"><strong>{label}</strong><small>{sublabel}</small></div><button className={`settings-switch ${checked?'is-on':''}`} onClick={onToggle} aria-pressed={checked}><span/></button></div>}
function InfoScreen({title,subtitle,children,onBack}:{title:string;subtitle:string;children:React.ReactNode;onBack:()=>void}){return <div className="page settings-page"><div className="settings-shell"><Header title={title} subtitle={subtitle} onBack={onBack}/><div className="settings-info-card">{children}</div></div></div>}

export function SettingsView(){
  const [screen,setScreen]=useState<SettingsScreen>('root');
  const [toggles,setToggles]=useState<Record<ToggleKey,boolean>>(()=>loadStored(storageKeys.notificationToggles,defaultToggles));
  const [frequency,setFrequency]=useState<NotificationFrequency>(()=>loadStored(storageKeys.notificationFrequency,'daily'));
  const [theme,setTheme]=useState<Theme>(()=>loadStored(storageKeys.theme,'Sistema'));
  const [language,setLanguage]=useState<Language>(()=>loadStored(storageKeys.language,'Español'));
  const [premiumStarted,setPremiumStarted]=useState(()=>loadStored(storageKeys.premiumRequested,false));
  const [helpItem,setHelpItem]=useState<HelpItem|null>(null);
  const [actionItem,setActionItem]=useState<ActionItem|null>(null);
  const [notice,setNotice]=useState('');
  const [settingsQuery,setSettingsQuery]=useState('');
  const [accountEditing,setAccountEditing]=useState(false);
  const [account,setAccount]=useState<AccountSettings>(()=>loadStored(storageKeys.settingsAccount,demoAccount));
  const [name,setName]=useState(account.name);
  const [email,setEmail]=useState(account.email);
  const [signingOut,setSigningOut]=useState(false);

  useEffect(()=>{
    let active=true;
    void supabase.auth.getUser().then(({data})=>{
      if(!active)return;
      const stored=loadStored<AccountSettings>(storageKeys.settingsAccount,demoAccount);
      const next=accountFromUser(data.user,stored);
      setAccount(next);
      setName(next.name);
      setEmail(next.email);
      if(next.name!==stored.name||next.email!==stored.email)saveStored(storageKeys.settingsAccount,next);
    });
    return ()=>{active=false};
  },[]);

  useEffect(()=>{saveStored(storageKeys.notificationToggles,toggles)},[toggles]);
  useEffect(()=>{saveStored(storageKeys.notificationFrequency,frequency)},[frequency]);
  useEffect(()=>{
    saveStored(storageKeys.theme,theme);
    const dark=theme==='Oscuro'||(theme==='Sistema'&&window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme=dark?'dark':'light';
  },[theme]);
  useEffect(()=>{
    saveStored(storageKeys.language,language);
    document.documentElement.lang=language==='Català'?'ca':language==='English'?'en':'es';
  },[language]);
  useEffect(()=>{saveStored(storageKeys.premiumRequested,premiumStarted)},[premiumStarted]);
  useEffect(()=>{saveStored(storageKeys.settingsAccount,account)},[account]);

  const toggle=(k:ToggleKey)=>setToggles(v=>({...v,[k]:!v[k]}));
  const saveAccount=()=>{const next={name:name.trim()||account.name,email:account.email};setAccount(next);setName(next.name);setEmail(next.email);setAccountEditing(false);flash('Datos guardados')};
  const cancelAccount=()=>{setName(account.name);setEmail(account.email);setAccountEditing(false)};
  const openHelp=(title:string,body:string)=>{setHelpItem({title,body});setScreen('helpDetail')};
  const openAction=(title:string,body:string)=>{setActionItem({title,body});setScreen('actionDetail')};
  const flash=(text:string)=>{setNotice(text);window.setTimeout(()=>setNotice(''),2200)};
  const signOutAll=async()=>{
    setSigningOut(true);
    setNotice('');
    try{
      const {error}=await supabase.auth.signOut({scope:'global'});
      if(error)throw error;
    }catch(error){
      setSigningOut(false);
      flash(error instanceof Error?error.message:'No se ha podido cerrar la sesión.');
    }
  };

  const rootRows=useMemo(()=>[
    {icon:UserRound,title:'Mi cuenta',subtitle:'Datos personales y preferencias',action:()=>setScreen('account')},
    {icon:ShieldCheck,title:'Seguridad',subtitle:'Contraseña y verificación',action:()=>setScreen('security')},
    {icon:LockKeyhole,title:'Privacidad',subtitle:'Controla tu información',action:()=>setScreen('privacy')},
    {icon:Bell,title:'Notificaciones',subtitle:'Alertas y recordatorios',action:()=>setScreen('notifications')},
    {icon:MoonStar,title:'Apariencia',subtitle:theme,action:()=>setScreen('appearance')},
    {icon:Globe,title:'Idioma',subtitle:language,action:()=>setScreen('language')},
    {icon:CircleHelp,title:'Centro de ayuda',subtitle:'Guías y soporte',action:()=>setScreen('help')},
    {icon:Sparkles,title:'Sobre CONECTA',subtitle:'Versión 2.0.0',action:()=>setScreen('about')}
  ].filter(r=>!settingsQuery.trim()||`${r.title} ${r.subtitle}`.toLocaleLowerCase('es').includes(settingsQuery.trim().toLocaleLowerCase('es'))),[settingsQuery,theme,language]);

  if(screen==='account')return <InfoScreen title="Mi cuenta" subtitle="Datos personales y preferencias" onBack={()=>setScreen('root')}>{accountEditing?<div className="settings-account-form"><label>Nombre<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Email de acceso<input type="email" value={email} readOnly aria-readonly="true"/></label><div><button className="settings-inline-action" onClick={saveAccount}>Guardar</button><button className="settings-secondary-action" onClick={cancelAccount}>Cancelar</button></div></div>:<><strong>{account.name}</strong><p>{account.email}</p><button className="settings-inline-action" onClick={()=>{setName(account.name);setEmail(account.email);setAccountEditing(true)}}>Editar datos</button></>}{notice&&<p className="settings-success">{notice}</p>}</InfoScreen>;
  if(screen==='appearance')return <InfoScreen title="Apariencia" subtitle="Elige cómo quieres ver CONECTA" onBack={()=>setScreen('root')}><div className="settings-choice-grid">{(['Claro','Oscuro','Sistema'] as const).map(v=><button key={v} className={theme===v?'is-active':''} onClick={()=>setTheme(v)}>{v}</button>)}</div><p>Preferencia actual: <strong>{theme}</strong></p></InfoScreen>;
  if(screen==='language')return <InfoScreen title="Idioma" subtitle="Idioma de la aplicación" onBack={()=>setScreen('root')}><div className="settings-choice-grid">{(['Español','Català','English'] as const).map(v=><button key={v} className={language===v?'is-active':''} onClick={()=>setLanguage(v)}>{v}</button>)}</div><p>Idioma seleccionado: <strong>{language}</strong></p><p>La preferencia se conserva en tu experiencia de CONECTA.</p></InfoScreen>;
  if(screen==='about')return <InfoScreen title="Sobre CONECTA" subtitle="Información de la aplicación" onBack={()=>setScreen('root')}><strong>CONECTA 2.0.0</strong><p>Planes reales, gente compatible. Prototipo de la experiencia CONECTA.</p></InfoScreen>;
  if(screen==='helpDetail'&&helpItem)return <InfoScreen title={helpItem.title} subtitle="Centro de ayuda" onBack={()=>setScreen('help')}><p>{helpItem.body}</p></InfoScreen>;
  if(screen==='actionDetail'&&actionItem)return <InfoScreen title={actionItem.title} subtitle="Configuración" onBack={()=>setScreen('root')}><p>{actionItem.body}</p><button className="settings-inline-action" onClick={()=>flash('Cambio guardado en el prototipo')}>Guardar preferencia</button>{notice&&<p className="settings-success">{notice}</p>}</InfoScreen>;

  if(screen==='security')return <div className="page settings-page"><div className="settings-shell"><Header title="Seguridad" subtitle="Mantén tu cuenta protegida" onBack={()=>setScreen('root')}/><div className="settings-list-card"><Row icon={LockKeyhole} title="Contraseña" subtitle="Acceso protegido por CONECTA" onClick={()=>openAction('Contraseña','Tu sesión ya utiliza autenticación real. El cambio de contraseña desde la app seguirá desactivado en esta versión demo hasta completar ese flujo específico.')}/><Row icon={ShieldCheck} title="Verificación en dos pasos" subtitle="Opción de seguridad del demo" onClick={()=>openAction('Verificación en dos pasos','Esta opción sigue siendo demostrativa. La sesión actual ya está gestionada por el sistema de autenticación de CONECTA.')}/><Row icon={Mail} title="Verificación de email" subtitle={`${account.email} · Cuenta actual`} onClick={()=>openAction('Verificación de email','Este es el correo asociado a la sesión autenticada con la que has entrado en CONECTA.')}/><Row icon={Smartphone} title="Verificación de teléfono" subtitle="Disponible en el demo" onClick={()=>openAction('Verificación de teléfono','La verificación por teléfono sigue formando parte de la experiencia demo y aún no está activada como método de acceso.')}/><Row icon={BadgeCheck} title="Apple" subtitle="Acceso demo" onClick={()=>openAction('Acceso con Apple','Apple se mantiene visible como parte del diseño demo. El acceso real disponible actualmente es el de correo y contraseña.')}/><Row icon={Globe} title="Google" subtitle="Acceso demo" onClick={()=>openAction('Acceso con Google','Google se mantiene visible como parte del diseño demo. El acceso real disponible actualmente es el de correo y contraseña.')}/><Row icon={Database} title="Sesiones activas" subtitle="Gestionadas por tu cuenta" onClick={()=>openAction('Sesiones activas','La sesión actual está gestionada por la autenticación real. El botón inferior cierra las sesiones activas de tu cuenta.')}/></div><button className="settings-danger-cta" disabled={signingOut} onClick={()=>{void signOutAll()}}><LogOut/><span><strong>{signingOut?'Cerrando sesiones…':'Cerrar todas las sesiones'}</strong><small>Cierra sesión en todos tus dispositivos</small></span></button>{notice&&<p className="settings-success">{notice}</p>}</div></div>;

  if(screen==='privacy')return <div className="page settings-page"><div className="settings-shell"><Header title="Privacidad" subtitle="Tú decides qué compartir" onBack={()=>setScreen('root')}/><div className="settings-list-card"><Row icon={Eye} title="Visibilidad del perfil" subtitle="Quién puede ver tu perfil" onClick={()=>openAction('Visibilidad del perfil','Configura quién puede ver tu perfil dentro del prototipo.')}/><Row icon={BadgeCheck} title="Quién puede ver tus planes" subtitle="Todos los usuarios" onClick={()=>openAction('Visibilidad de planes','Elige quién puede ver los planes que publicas.')}/><Row icon={MapPinned} title="Control de ubicación" subtitle="Cuándo se muestra tu ubicación" onClick={()=>openAction('Control de ubicación','Decide cuándo se puede mostrar tu ubicación en CONECTA.')}/><Row icon={MessageCircleMore} title="Quién puede enviarte mensajes" subtitle="Solo usuarios conectados" onClick={()=>openAction('Mensajes','Configura quién puede iniciar una conversación contigo.')}/><Row icon={UserRound} title="Solicitudes de conexión" subtitle="Quién puede enviarte solicitudes" onClick={()=>openAction('Solicitudes de conexión','Controla quién puede enviarte solicitudes de conexión.')}/><Row icon={UserX} title="Usuarios bloqueados" subtitle="Gestiona usuarios bloqueados" onClick={()=>openAction('Usuarios bloqueados','Aquí aparecerá la lista de usuarios bloqueados del prototipo.')}/><Row icon={Database} title="Datos y actividad" subtitle="Gestiona tu información" onClick={()=>openAction('Datos y actividad','Revisa la información y actividad asociada a tu perfil en esta versión demo.')}/><Row icon={Download} title="Descargar mis datos" subtitle="Recibe una copia de tu información" onClick={()=>{const blob=new Blob([JSON.stringify({name:account.name,email:account.email,language,theme},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='conecta-datos-demo.json';a.click();URL.revokeObjectURL(url);flash('Copia demo preparada')}}/><Row icon={LogOut} title="Eliminar cuenta" subtitle="Elimina tu cuenta y todos tus datos" danger onClick={()=>openAction('Eliminar cuenta','Tu cuenta ya usa backend real, pero el borrado se mantiene protegido y desactivado en esta versión demo para evitar eliminaciones accidentales.')}/></div>{notice&&<p className="settings-success">{notice}</p>}</div></div>;

  if(screen==='notifications')return <div className="page settings-page"><div className="settings-shell"><Header title="Notificaciones" subtitle="Elige qué quieres recibir" onBack={()=>setScreen('root')}/><div className="settings-block"><ToggleRow label="Nuevos mensajes" sublabel="Cuando recibas un mensaje" checked={toggles.messages} onToggle={()=>toggle('messages')}/><ToggleRow label="Solicitudes de conexión" sublabel="Nuevas solicitudes" checked={toggles.requests} onToggle={()=>toggle('requests')}/><ToggleRow label="Actualizaciones de planes" sublabel="Cambios en tus planes" checked={toggles.planUpdates} onToggle={()=>toggle('planUpdates')}/><ToggleRow label="Recordatorios" sublabel="Avisos de tus próximos planes" checked={toggles.reminders} onToggle={()=>toggle('reminders')}/><ToggleRow label="Novedades de la app" sublabel="Noticias y mejoras" checked={toggles.news} onToggle={()=>toggle('news')}/><ToggleRow label="Ofertas y promociones" sublabel="Solo para usuarios Premium" checked={toggles.offers} onToggle={()=>toggle('offers')}/></div><div className="settings-block"><div className="settings-block-title">Frecuencia</div>{([['daily','Resumen diario','Recibe un resumen al final del día'],['weekly','Resumen semanal','Un resumen cada semana'],['important','Solo notificaciones importantes','Solo lo esencial']] as const).map(([key,title,sub])=><button key={key} className={`settings-frequency-option ${frequency===key?'is-active':''}`} onClick={()=>setFrequency(key)}><span className="settings-frequency-copy"><strong>{title}</strong><small>{sub}</small></span><span className="settings-radio"><span/></span></button>)}</div></div></div>;

  if(screen==='help')return <div className="page settings-page"><div className="settings-shell"><Header title="Centro de ayuda" subtitle="Guías, soporte y contacto" onBack={()=>setScreen('root')}/><div className="settings-list-card"><Row icon={CircleHelp} title="Guía de CONECTA" subtitle="Cómo usar la app" onClick={()=>openHelp('Guía de CONECTA','Descubre planes, únete a actividades, conoce personas compatibles y gestiona tus conexiones desde una sola app.')}/><Row icon={ShieldCheck} title="Normas de la comunidad" subtitle="Nuestras reglas" onClick={()=>openHelp('Normas de la comunidad','Respeto, seguridad y convivencia. No se permite acoso, suplantación ni contenido que ponga en riesgo a otros usuarios.')}/><Row icon={BadgeCheck} title="Seguridad en la app" subtitle="Consejos y buenas prácticas" onClick={()=>openHelp('Seguridad en la app','Queda siempre en lugares públicos, revisa los perfiles y utiliza las herramientas de bloqueo y reporte si algo no te convence.')}/><Row icon={LockKeyhole} title="Privacidad" subtitle="Cómo protegemos tus datos" onClick={()=>openHelp('Privacidad','Desde Privacidad puedes controlar quién ve tu perfil, tus planes y quién puede enviarte mensajes.')}/><Row icon={Database} title="Condiciones de uso" subtitle="Términos y condiciones" onClick={()=>openHelp('Condiciones de uso','Consulta aquí las condiciones que regulan el uso de CONECTA. Este prototipo aún no sustituye los textos legales definitivos.')}/><Row icon={Mail} title="Soporte técnico" subtitle="soporte@conectaapp.com" onClick={()=>window.location.href='mailto:soporte@conectaapp.com?subject=Soporte%20CONECTA'}/><Row icon={MessageCircleMore} title="Enviar feedback" subtitle="Cuéntanos tu opinión" onClick={()=>window.location.href='mailto:soporte@conectaapp.com?subject=Feedback%20CONECTA'}/></div><div className="settings-support-box"><div><strong>¿Necesitas ayuda?</strong><small>Nuestro equipo está aquí para ti.</small></div><button onClick={()=>window.location.href='mailto:soporte@conectaapp.com?subject=Ayuda%20CONECTA'}>Contactar soporte</button></div></div></div>;

  if(screen==='premium')return <div className="page settings-page"><div className="settings-shell"><Header title="Conecta Premium" subtitle="Más planes. Más personas. Más vida." onBack={()=>setScreen('root')}/><div className="premium-hero-card"><div className="premium-card-visual"><div className="premium-card-chip"/><div className="premium-card-brand">CONECTA</div></div><div className="premium-hero-copy"><h2>Vive más experiencias</h2><p>Conecta Premium te da acceso a más oportunidades para hacer planes y conocer gente increíble.</p></div></div><div className="premium-benefits-list">{[['1','Más visibilidad','Tu perfil llega a más personas'],['2','Planes prioritarios','Destaca tus planes en la app'],['3','Ofertas exclusivas','Accede a promociones especiales'],['4','Filtros avanzados','Encuentra personas afines'],['5','Apoya la comunidad','Ayúdanos a seguir mejorando CONECTA']].map(([n,t,s])=><div key={n} className="premium-benefit-row"><span className="premium-number">{n}</span><div><strong>{t}</strong><small>{s}</small></div></div>)}</div><button className="premium-main-cta" onClick={()=>setPremiumStarted(true)}>{premiumStarted?'Solicitud iniciada':'Hazte Premium'} <ChevronRight/></button>{premiumStarted&&<p className="settings-success">Perfecto. El siguiente paso será conectar aquí el pago real cuando activemos esa función.</p>}<p className="premium-footnote">Desde 4,99 €/mes · Cancela cuando quieras</p></div></div>;

  return <div className="page settings-page"><div className="settings-shell"><Header title="Ajustes" subtitle="Personaliza tu experiencia en CONECTA"/><div className="settings-search"><input value={settingsQuery} onChange={e=>setSettingsQuery(e.target.value)} placeholder="Buscar en ajustes..." aria-label="Buscar en ajustes"/></div><div className="settings-list-card">{rootRows.length?rootRows.map(r=><Row key={r.title} icon={r.icon} title={r.title} subtitle={r.subtitle} onClick={r.action}/>):<div className="settings-empty">No hay ajustes que coincidan.</div>}</div><button className="settings-premium-entry" onClick={()=>setScreen('premium')}><div className="settings-premium-entry-card"><div className="settings-premium-entry-chip"/></div><div className="settings-premium-entry-copy"><strong>Conecta Premium</strong><small>Vive más experiencias</small></div><ChevronRight/></button></div></div>;
}
