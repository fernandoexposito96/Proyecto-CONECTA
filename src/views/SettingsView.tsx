import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, CircleHelp, Database, Download, Eye, Globe, LockKeyhole, LogOut, Mail, MapPinned, MessageCircleMore, MoonStar, ShieldCheck, Smartphone, Sparkles, UserRound, UserX, BadgeCheck, Save, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Screen='root'|'account'|'security'|'privacy'|'notifications'|'appearance'|'language'|'help'|'about'|'premium';
type ToggleKey='messages'|'requests'|'planUpdates'|'reminders'|'news'|'offers';
type Frequency='daily'|'weekly'|'important';
type Privacy={profileVisibility:string;plansVisibility:string;location:string;messages:string;requests:string};
type Preferences={toggles:Record<ToggleKey,boolean>;frequency:Frequency;privacy:Privacy;appearance:'light'|'dark'|'system';language:'es'|'ca'|'en'};

const defaults:Preferences={
  toggles:{messages:true,requests:true,planUpdates:true,reminders:true,news:true,offers:true},
  frequency:'daily',
  privacy:{profileVisibility:'everyone',plansVisibility:'everyone',location:'approximate',messages:'connections',requests:'everyone'},
  appearance:'light',language:'es'
};

const rootRows=[
  ['account',UserRound,'Mi cuenta','Datos personales y preferencias'],
  ['security',ShieldCheck,'Seguridad','Contraseña, verificación y sesiones'],
  ['privacy',LockKeyhole,'Privacidad','Controla quién puede ver tu información'],
  ['notifications',Bell,'Notificaciones','Alertas y recordatorios'],
  ['appearance',MoonStar,'Apariencia','Tema y modo de visualización'],
  ['language',Globe,'Idioma','Español, Català, English'],
  ['help',CircleHelp,'Centro de ayuda','Guías, soporte y contacto'],
  ['about',Sparkles,'Sobre CONECTA','Información de la aplicación'],
] as const;

function Header({title,subtitle,onBack}:{title:string;subtitle:string;onBack?:()=>void}){return <div className="settings-header">{onBack?<button type="button" className="settings-back" onClick={onBack}><ChevronLeft/></button>:<span className="settings-back placeholder"/>}<div className="settings-header-copy"><h1>{title}</h1><p>{subtitle}</p></div><span className="settings-back placeholder"/></div>}
function Row({icon:Icon,title,subtitle,onClick,danger=false}:{icon:any;title:string;subtitle:string;onClick?:()=>void;danger?:boolean}){return <button type="button" className={`settings-row ${danger?'is-danger':''}`} onClick={onClick}><span className="settings-row-icon"><Icon/></span><span className="settings-row-copy"><strong>{title}</strong><small>{subtitle}</small></span><ChevronRight/></button>}
function ToggleRow({label,sublabel,checked,onToggle}:{label:string;sublabel:string;checked:boolean;onToggle:()=>void}){return <div className="settings-toggle-row"><div className="settings-toggle-copy"><strong>{label}</strong><small>{sublabel}</small></div><button type="button" className={`settings-switch ${checked?'is-on':''}`} onClick={onToggle} aria-pressed={checked}><span/></button></div>}
function SelectRow({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:[string,string][]}){return <label className="settings-select-row"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>}

export function SettingsView(){
  const [screen,setScreen]=useState<Screen>('root');
  const [prefs,setPrefs]=useState<Preferences>(()=>{try{return {...defaults,...JSON.parse(localStorage.getItem('conecta-settings')||'{}')}}catch{return defaults}});
  const [query,setQuery]=useState('');
  const [user,setUser]=useState<any>(null);
  const [account,setAccount]=useState({name:'Fernando',location:'Tarragona',bio:'Deporte, viajes, buena comida y conocer gente increíble.'});
  const [status,setStatus]=useState('');
  const [mfaQr,setMfaQr]=useState('');
  const [mfaFactor,setMfaFactor]=useState('');
  const [mfaCode,setMfaCode]=useState('');

  const notify=(text:string)=>{setStatus(text);window.setTimeout(()=>setStatus(''),3200)};

  useEffect(()=>{
    let active=true;
    supabase.auth.getSession().then(async({data})=>{
      if(!active)return;
      const current=data.session?.user??null; setUser(current);
      if(current){
        setAccount({name:current.user_metadata?.name||current.user_metadata?.full_name||'Fernando',location:current.user_metadata?.location||'Tarragona',bio:current.user_metadata?.bio||'Deporte, viajes, buena comida y conocer gente increíble.'});
        const {data:remote}=await supabase.from('user_settings').select('*').eq('user_id',current.id).maybeSingle();
        if(remote){setPrefs(p=>({...p,toggles:{...p.toggles,...remote.notifications,frequency:undefined as never},frequency:remote.notifications?.frequency||p.frequency,privacy:{...p.privacy,...remote.privacy},appearance:remote.appearance||p.appearance,language:remote.language||p.language}))}
      }
    });
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user??null));
    return()=>{active=false;listener.subscription.unsubscribe()};
  },[]);

  useEffect(()=>{
    localStorage.setItem('conecta-settings',JSON.stringify(prefs));
    document.documentElement.dataset.conectaTheme=prefs.appearance;
    if(user){supabase.from('user_settings').upsert({user_id:user.id,notifications:{...prefs.toggles,frequency:prefs.frequency},privacy:prefs.privacy,appearance:prefs.appearance,language:prefs.language,updated_at:new Date().toISOString()},{onConflict:'user_id'}).then(({error})=>{if(error)console.error('settings sync',error)})}
  },[prefs,user]);

  const filtered=useMemo(()=>rootRows.filter(([, ,t,s])=>(t+' '+s).toLowerCase().includes(query.toLowerCase())),[query]);
  const back=()=>setScreen('root');
  const setPrivacy=(key:keyof Privacy,value:string)=>setPrefs(p=>({...p,privacy:{...p.privacy,[key]:value}}));
  const toggle=(key:ToggleKey)=>setPrefs(p=>({...p,toggles:{...p.toggles,[key]:!p.toggles[key]}}));

  const saveAccount=async()=>{
    localStorage.setItem('conecta-profile-settings',JSON.stringify(account));
    if(user){const {error}=await supabase.auth.updateUser({data:{name:account.name,location:account.location,bio:account.bio}});if(error)return notify('No se pudieron guardar los datos: '+error.message)}
    notify('Datos guardados correctamente');
  };
  const sendPasswordReset=async()=>{
    const email=user?.email;
    if(!email)return notify('Inicia sesión para cambiar la contraseña');
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
    notify(error?'No se pudo enviar el enlace: '+error.message:'Te hemos enviado un enlace seguro al correo');
  };
  const startOAuth=async(provider:'google'|'apple')=>{
    const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:window.location.href}}); if(error)notify(error.message);
  };
  const enrollMfa=async()=>{
    if(!user)return notify('Inicia sesión para configurar la verificación en dos pasos');
    const {data,error}=await supabase.auth.mfa.enroll({factorType:'totp',friendlyName:'CONECTA'});
    if(error)return notify(error.message);
    setMfaFactor(data.id);setMfaQr(data.totp.qr_code);notify('Escanea el QR y escribe el código de 6 dígitos');
  };
  const verifyMfa=async()=>{
    if(!mfaFactor||mfaCode.length<6)return notify('Introduce el código de 6 dígitos');
    const {error}=await supabase.auth.mfa.challengeAndVerify({factorId:mfaFactor,code:mfaCode});
    if(error)return notify('Código no válido: '+error.message);setMfaQr('');setMfaFactor('');setMfaCode('');notify('Verificación en dos pasos activada');
  };
  const signOutAll=async()=>{const {error}=await supabase.auth.signOut({scope:'global'});notify(error?error.message:'Sesiones cerradas correctamente')};
  const downloadData=()=>{
    const blob=new Blob([JSON.stringify({profile:account,settings:prefs,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='conecta-mis-datos.json';a.click();URL.revokeObjectURL(a.href);notify('Copia de datos descargada');
  };

  if(screen==='account')return <div className="page settings-page"><div className="settings-shell"><Header title="Mi cuenta" subtitle="Tus datos personales" onBack={back}/><div className="settings-form-card"><label>Nombre<input value={account.name} onChange={e=>setAccount({...account,name:e.target.value})}/></label><label>Ubicación<input value={account.location} onChange={e=>setAccount({...account,location:e.target.value})}/></label><label>Sobre mí<textarea value={account.bio} onChange={e=>setAccount({...account,bio:e.target.value})}/></label><label>Email<input value={user?.email||'Sin sesión iniciada'} disabled/></label><button className="settings-primary" onClick={saveAccount}><Save/> Guardar cambios</button></div></div></div>;

  if(screen==='security')return <div className="page settings-page"><div className="settings-shell"><Header title="Seguridad" subtitle="Mantén tu cuenta protegida" onBack={back}/><div className="settings-list-card"><Row icon={LockKeyhole} title="Cambiar contraseña" subtitle={user?.email||'Necesitas iniciar sesión'} onClick={sendPasswordReset}/><Row icon={ShieldCheck} title="Verificación en dos pasos" subtitle="Configura un autenticador TOTP" onClick={enrollMfa}/><Row icon={Mail} title="Email" subtitle={user?`${user.email||'Sin email'} · ${user.email_confirmed_at?'Verificado':'Pendiente'}`:'Sin sesión'}/><Row icon={Smartphone} title="Teléfono" subtitle={user?.phone||'No configurado'}/><Row icon={BadgeCheck} title="Apple" subtitle={user?.identities?.some((i:any)=>i.provider==='apple')?'Conectado':'Conectar cuenta'} onClick={()=>startOAuth('apple')}/><Row icon={Globe} title="Google" subtitle={user?.identities?.some((i:any)=>i.provider==='google')?'Conectado':'Conectar cuenta'} onClick={()=>startOAuth('google')}/><Row icon={Database} title="Sesión actual" subtitle={user?'Sesión activa y protegida':'No hay sesión iniciada'}/></div>{mfaQr&&<div className="settings-mfa"><img src={mfaQr} alt="QR de autenticación"/><input inputMode="numeric" maxLength={6} placeholder="Código de 6 dígitos" value={mfaCode} onChange={e=>setMfaCode(e.target.value.replace(/\D/g,''))}/><button className="settings-primary" onClick={verifyMfa}>Activar 2FA</button></div>}<button className="settings-danger-cta" onClick={signOutAll}><LogOut/><span><strong>Cerrar todas las sesiones</strong><small>Revoca las sesiones de tu cuenta</small></span></button></div></div>;

  if(screen==='privacy')return <div className="page settings-page"><div className="settings-shell"><Header title="Privacidad" subtitle="Tú decides qué compartir" onBack={back}/><div className="settings-list-card settings-select-card"><SelectRow label="Visibilidad del perfil" value={prefs.privacy.profileVisibility} onChange={v=>setPrivacy('profileVisibility',v)} options={[["everyone","Todos"],["connections","Solo conexiones"],["private","Privado"]]}/><SelectRow label="Quién puede ver tus planes" value={prefs.privacy.plansVisibility} onChange={v=>setPrivacy('plansVisibility',v)} options={[["everyone","Todos"],["connections","Solo conexiones"],["private","Solo yo"]]}/><SelectRow label="Ubicación" value={prefs.privacy.location} onChange={v=>setPrivacy('location',v)} options={[["approximate","Aproximada"],["city","Solo ciudad"],["off","Oculta"]]}/><SelectRow label="Mensajes" value={prefs.privacy.messages} onChange={v=>setPrivacy('messages',v)} options={[["everyone","Todos"],["connections","Solo conexiones"],["none","Nadie"]]}/><SelectRow label="Solicitudes de conexión" value={prefs.privacy.requests} onChange={v=>setPrivacy('requests',v)} options={[["everyone","Todos"],["verified","Solo verificados"],["none","Nadie"]]}/></div><div className="settings-list-card"><Row icon={UserX} title="Usuarios bloqueados" subtitle="Gestiona las personas bloqueadas" onClick={()=>notify('No tienes usuarios bloqueados en esta versión')}/><Row icon={Download} title="Descargar mis datos" subtitle="Obtén una copia JSON de tus datos" onClick={downloadData}/><Row icon={LogOut} title="Eliminar cuenta" subtitle="Requiere confirmación de identidad" danger onClick={()=>notify('La eliminación definitiva requiere confirmación segura de identidad')}/></div></div></div>;

  if(screen==='notifications')return <div className="page settings-page"><div className="settings-shell"><Header title="Notificaciones" subtitle="Elige qué quieres recibir" onBack={back}/><div className="settings-block">{([['messages','Nuevos mensajes','Cuando recibas un mensaje'],['requests','Solicitudes de conexión','Nuevas solicitudes'],['planUpdates','Actualizaciones de planes','Cambios en tus planes'],['reminders','Recordatorios','Avisos de próximos planes'],['news','Novedades de la app','Noticias y mejoras'],['offers','Ofertas y promociones','Solo usuarios Premium']] as [ToggleKey,string,string][]).map(([k,l,s])=><ToggleRow key={k} label={l} sublabel={s} checked={prefs.toggles[k]} onToggle={()=>toggle(k)}/>)}</div><div className="settings-block"><div className="settings-block-title">Frecuencia</div>{([['daily','Resumen diario'],['weekly','Resumen semanal'],['important','Solo importantes']] as [Frequency,string][]).map(([k,t])=><button key={k} className={`settings-frequency-option ${prefs.frequency===k?'is-active':''}`} onClick={()=>setPrefs(p=>({...p,frequency:k}))}><span className="settings-frequency-copy"><strong>{t}</strong><small>Se guarda automáticamente</small></span><span className="settings-radio"><span/></span></button>)}</div></div></div>;

  if(screen==='appearance')return <div className="page settings-page"><div className="settings-shell"><Header title="Apariencia" subtitle="Elige cómo quieres ver CONECTA" onBack={back}/><div className="settings-list-card settings-select-card"><SelectRow label="Tema" value={prefs.appearance} onChange={v=>setPrefs(p=>({...p,appearance:v as Preferences['appearance']}))} options={[["light","Claro"],["dark","Oscuro"],["system","Sistema"]]}/></div><div className="settings-status-card"><CheckCircle2/><div><strong>Preferencia guardada</strong><small>Se aplicará automáticamente en tus próximas sesiones.</small></div></div></div></div>;

  if(screen==='language')return <div className="page settings-page"><div className="settings-shell"><Header title="Idioma" subtitle="Idioma preferido de CONECTA" onBack={back}/><div className="settings-list-card settings-select-card"><SelectRow label="Idioma" value={prefs.language} onChange={v=>setPrefs(p=>({...p,language:v as Preferences['language']}))} options={[["es","Español"],["ca","Català"],["en","English"]]}/></div><div className="settings-status-card"><Globe/><div><strong>Idioma guardado</strong><small>La preferencia queda sincronizada con tu cuenta.</small></div></div></div></div>;

  if(screen==='help')return <div className="page settings-page"><div className="settings-shell"><Header title="Centro de ayuda" subtitle="Guías, soporte y contacto" onBack={back}/><div className="settings-list-card"><Row icon={CircleHelp} title="Guía de CONECTA" subtitle="Cómo usar la app" onClick={()=>notify('Guía: explora planes, únete, conecta y chatea desde la navegación inferior')}/><Row icon={ShieldCheck} title="Seguridad en la app" subtitle="Consejos y buenas prácticas" onClick={()=>notify('No compartas contraseñas ni códigos de verificación')}/><Row icon={LockKeyhole} title="Privacidad" subtitle="Controla quién puede verte" onClick={()=>setScreen('privacy')}/><Row icon={Mail} title="Soporte técnico" subtitle="Contactar por correo" onClick={()=>{window.location.href='mailto:soporte@conectaapp.com?subject=Soporte%20CONECTA'}}/><Row icon={MessageCircleMore} title="Enviar feedback" subtitle="Cuéntanos tu opinión" onClick={()=>{window.location.href='mailto:soporte@conectaapp.com?subject=Feedback%20CONECTA'}}/></div></div></div>;

  if(screen==='about')return <div className="page settings-page"><div className="settings-shell"><Header title="Sobre CONECTA" subtitle="Información de la aplicación" onBack={back}/><div className="settings-status-card"><Sparkles/><div><strong>CONECTA 2.0.0</strong><small>Planes reales, personas compatibles y una comunidad más segura.</small></div></div><div className="settings-list-card"><Row icon={ShieldCheck} title="Privacidad y seguridad" subtitle="Preferencias protegidas por usuario" onClick={()=>setScreen('privacy')}/><Row icon={CircleHelp} title="Centro de ayuda" subtitle="Soporte y contacto" onClick={()=>setScreen('help')}/></div></div></div>;

  if(screen==='premium')return <div className="page settings-page"><div className="settings-shell"><Header title="Conecta Premium" subtitle="Más planes. Más personas. Más vida." onBack={back}/><div className="premium-hero-card"><div className="premium-card-visual"><div className="premium-card-chip"/><div className="premium-card-brand">CONECTA</div></div><div className="premium-hero-copy"><h2>Vive más experiencias</h2><p>Más visibilidad, prioridad y ventajas exclusivas.</p></div></div><div className="premium-benefits-list">{[['1','Más visibilidad','Tu perfil llega a más personas'],['2','Planes prioritarios','Destaca tus planes'],['3','Ofertas exclusivas','Promociones especiales'],['4','Filtros avanzados','Encuentra personas afines'],['5','Apoya la comunidad','Ayúdanos a mejorar CONECTA']].map(([n,t,s])=><div key={n} className="premium-benefit-row"><span className="premium-number">{n}</span><div><strong>{t}</strong><small>{s}</small></div></div>)}</div><button className="premium-main-cta" onClick={()=>notify('La pasarela de pago aún no está conectada al proyecto')} >Hazte Premium <ChevronRight/></button><p className="premium-footnote">Desde 4,99 €/mes · Cancela cuando quieras</p></div></div>;

  return <div className="page settings-page"><div className="settings-shell"><Header title="Ajustes" subtitle="Personaliza tu experiencia en CONECTA"/><input className="settings-search-input" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar en ajustes..."/><div className="settings-list-card">{filtered.map(([target,Icon,title,sub])=><Row key={target} icon={Icon} title={title} subtitle={sub} onClick={()=>setScreen(target)}/>)}</div><button className="settings-premium-entry" onClick={()=>setScreen('premium')}><div className="settings-premium-entry-card"><div className="settings-premium-entry-chip"/></div><div className="settings-premium-entry-copy"><strong>Conecta Premium</strong><small>Vive más experiencias</small></div><ChevronRight/></button>{status&&<div className="settings-toast">{status}</div>}</div></div>;
}
