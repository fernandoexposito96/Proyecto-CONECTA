import { useEffect, useMemo, useState } from 'react';
import { PremiumContent } from '../components/PremiumContent';
import { BadgeCheck, ChevronRight, CircleHelp, Database, LockKeyhole, LogOut, Mail, MapPinned, MessageCircleMore, ShieldCheck, UsersRound } from 'lucide-react';
import { accountFromUser, demoAccount } from '../lib/identity';
import { loadProfilePrivacySettings, removeBackendBlock, saveProfilePrivacySetting, syncBackendBlocks } from '../lib/privacyBackend';
import { saveAccountIdentity, submitSupportRequest } from '../lib/settingsBackend';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import { supabase } from '../lib/supabase';
import type { AccountSettings, ActionItem, BlockedUser, HelpItem, Language, NotificationFrequency, PrivacyFieldKey, PrivacySettings, SettingsScreen, Theme, ToggleKey } from '../types';
import { BlockedUsersScreen, PrivacyFieldScreen, PrivacySettingsScreen } from './settings/PrivacySettingsScreens';
import { ChangePasswordScreen, SecuritySettingsScreen } from './settings/SecuritySettingsScreens';
import { SettingsHeader, SettingsInfoScreen, SettingsRow, SettingsToggleRow } from './settings/SettingsPrimitives';
import { appearanceOptions, buildRootSettingsItems, defaultPrivacy, languageOptions, notificationFrequencyOptions } from './settings/settingsCatalog';

const defaultToggles:Record<ToggleKey,boolean>={messages:true,requests:true,planUpdates:true,reminders:true,news:true,offers:true};

function loadBlockedUsers():BlockedUser[]{
  const stored=loadStored<Array<BlockedUser|string>>(storageKeys.blockedUsers,[]);
  return stored.flatMap((item,index)=>{
    if(typeof item==='string')return [{userId:`legacy-${index}-${item}`,name:item}];
    if(item&&typeof item.userId==='string'&&typeof item.name==='string')return [item];
    return [];
  });
}

export function SettingsView(){
  const [screen,setScreen]=useState<SettingsScreen>('root');
  const [toggles,setToggles]=useState<Record<ToggleKey,boolean>>(()=>loadStored(storageKeys.notificationToggles,defaultToggles));
  const [frequency,setFrequency]=useState<NotificationFrequency>(()=>loadStored(storageKeys.notificationFrequency,'daily'));
  const [theme,setTheme]=useState<Theme>(()=>loadStored(storageKeys.theme,'Sistema'));
  const [accent,setAccent]=useState(()=>loadStored(storageKeys.accent,'Violeta'));
  const [largeText,setLargeText]=useState(()=>loadStored(storageKeys.largeText,false));
  const [highContrast,setHighContrast]=useState(()=>loadStored(storageKeys.highContrast,false));
  const [compactView,setCompactView]=useState(()=>loadStored(storageKeys.compactView,false));
  const [reducedMotion,setReducedMotion]=useState(()=>loadStored(storageKeys.reducedMotion,false));
  const [language,setLanguage]=useState<Language>(()=>loadStored(storageKeys.language,'Español'));
  const [premiumStarted,setPremiumStarted]=useState(()=>loadStored(storageKeys.premiumRequested,false));
  const [helpItem,setHelpItem]=useState<HelpItem|null>(null);
  const [actionItem,setActionItem]=useState<ActionItem|null>(null);
  const [actionReturnScreen,setActionReturnScreen]=useState<SettingsScreen>('root');
  const [notice,setNotice]=useState('');
  const [settingsQuery,setSettingsQuery]=useState('');
  const [accountEditing,setAccountEditing]=useState(false);
  const [account,setAccount]=useState<AccountSettings>(()=>loadStored(storageKeys.settingsAccount,demoAccount));
  const [name,setName]=useState(account.name);
  const [accountSaving,setAccountSaving]=useState(false);
  const [accountError,setAccountError]=useState('');
  const [signingOut,setSigningOut]=useState(false);
  const [privacy,setPrivacy]=useState<PrivacySettings>(()=>loadStored(storageKeys.privacySettings,defaultPrivacy));
  const [privacyField,setPrivacyField]=useState<PrivacyFieldKey|null>(null);
  const [blockedUsers,setBlockedUsers]=useState<BlockedUser[]>(loadBlockedUsers);
  const [newPassword,setNewPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [passwordSaving,setPasswordSaving]=useState(false);
  const [passwordError,setPasswordError]=useState('');
  const [supportKind,setSupportKind]=useState<'help'|'improvement'>('help');
  const [supportSubject,setSupportSubject]=useState('');
  const [supportMessage,setSupportMessage]=useState('');
  const [supportSaving,setSupportSaving]=useState(false);
  const [supportError,setSupportError]=useState('');

  useEffect(()=>{
    let active=true;
    void supabase.auth.getUser().then(({data,error})=>{
      if(error)throw error;
      if(!active)return;
      const stored=loadStored<AccountSettings>(storageKeys.settingsAccount,demoAccount);
      const next=accountFromUser(data.user,stored);
      setAccount(next);
      setName(next.name);
      if(next.name!==stored.name||next.email!==stored.email)saveStored(storageKeys.settingsAccount,next);
    }).catch(error=>console.warn('CONECTA settings identity unavailable; demo identity kept',error));
    return ()=>{active=false};
  },[]);

  useEffect(()=>{
    let active=true;
    const current=loadStored<PrivacySettings>(storageKeys.privacySettings,defaultPrivacy);
    void loadProfilePrivacySettings(current).then(remote=>{
      if(active&&remote)setPrivacy(remote);
    }).catch(error=>console.warn('CONECTA privacy load failed; local privacy kept',error));
    return ()=>{active=false};
  },[]);

  useEffect(()=>{saveStored(storageKeys.notificationToggles,toggles)},[toggles]);
  useEffect(()=>{saveStored(storageKeys.notificationFrequency,frequency)},[frequency]);
  useEffect(()=>{saveStored(storageKeys.accent,accent);document.documentElement.dataset.accent=accent.toLowerCase()},[accent]);
  useEffect(()=>{saveStored(storageKeys.largeText,largeText);document.documentElement.classList.toggle('large-text',largeText)},[largeText]);
  useEffect(()=>{saveStored(storageKeys.highContrast,highContrast);document.documentElement.classList.toggle('high-contrast',highContrast)},[highContrast]);
  useEffect(()=>{saveStored(storageKeys.compactView,compactView);document.documentElement.classList.toggle('compact-view',compactView)},[compactView]);
  useEffect(()=>{saveStored(storageKeys.reducedMotion,reducedMotion);document.documentElement.classList.toggle('reduced-motion',reducedMotion)},[reducedMotion]);
  useEffect(()=>{
    saveStored(storageKeys.theme,theme);
    const dark=theme==='Oscuro'||(theme==='Sistema'&&window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme=dark?'dark':'light';
  },[theme]);
  useEffect(()=>{
    saveStored(storageKeys.language,language);
    const langMap:Record<Language,string>={Español:'es',Català:'ca',English:'en',Français:'fr',Deutsch:'de',Italiano:'it',Português:'pt'}; document.documentElement.lang=langMap[language];
  },[language]);
  useEffect(()=>{saveStored(storageKeys.premiumRequested,premiumStarted)},[premiumStarted]);
  useEffect(()=>{saveStored(storageKeys.settingsAccount,account)},[account]);
  useEffect(()=>{saveStored(storageKeys.privacySettings,privacy)},[privacy]);
  useEffect(()=>{
    saveStored(storageKeys.blockedUsers,blockedUsers);
    void syncBackendBlocks(blockedUsers).catch(error=>console.warn('CONECTA block sync failed; local blocks kept',error));
  },[blockedUsers]);

  const flash=(text:string)=>{
    setNotice(text);
    window.setTimeout(()=>setNotice(''),2200);
  };
  const toggle=(key:ToggleKey)=>setToggles(value=>({...value,[key]:!value[key]}));
  const saveAccount=async()=>{
    const next={name:name.trim()||account.name,email:account.email};
    setAccountError('');
    setAccountSaving(true);
    try{
      const saved=await saveAccountIdentity(next);
      if(!saved)throw new Error('No hay una sesión activa para guardar los datos.');
      setAccount(next);
      setName(next.name);
      setAccountEditing(false);
      flash('Datos guardados');
    }catch(error){
      setAccountError(error instanceof Error?error.message:'No se han podido guardar los datos.');
    }finally{
      setAccountSaving(false);
    }
  };
  const cancelAccount=()=>{
    setName(account.name);
    setAccountError('');
    setAccountEditing(false);
  };
  const openHelp=(title:string,body:string)=>{
    setHelpItem({title,body});
    setScreen('helpDetail');
  };
  const openAction=(title:string,body:string,returnScreen:SettingsScreen='root')=>{
    setActionItem({title,body});
    setActionReturnScreen(returnScreen);
    setScreen('actionDetail');
  };
  const openSupport=(kind:'help'|'improvement')=>{
    setSupportKind(kind);
    setSupportSubject(kind==='help'?'Ayuda con CONECTA':'Sugerencia para CONECTA');
    setSupportMessage('');
    setSupportError('');
    setScreen('supportForm');
  };
  const sendSupport=async()=>{
    setSupportError('');
    setSupportSaving(true);
    try{
      await submitSupportRequest(supportKind,supportSubject,supportMessage,account.email);
      setSupportMessage('');
      setScreen('help');
      flash(supportKind==='help'?'Solicitud enviada a soporte':'Feedback enviado');
    }catch(error){
      setSupportError(error instanceof Error?error.message:'No se ha podido enviar la solicitud.');
    }finally{
      setSupportSaving(false);
    }
  };
  const openPrivacyField=(key:PrivacyFieldKey)=>{
    setPrivacyField(key);
    setScreen('privacyField');
  };
  const setPrivacyValue=<K extends PrivacyFieldKey>(key:K,value:PrivacySettings[K])=>{
    setPrivacy(current=>({...current,[key]:value}));
    void saveProfilePrivacySetting(key,value,privacy).catch(error=>console.warn('CONECTA privacy save failed; local preference kept',error));
    flash('Preferencia guardada');
  };
  const unblockUser=(userId:string)=>{
    const user=blockedUsers.find(item=>item.userId===userId);
    setBlockedUsers(current=>current.filter(item=>item.userId!==userId));
    void removeBackendBlock(userId).catch(error=>console.warn('CONECTA backend unblock failed; local unblock kept',error));
    flash(user?`${user.name} desbloqueado`:'Usuario desbloqueado');
  };
  const downloadData=()=>{
    const payload={
      cuenta:{name:account.name,email:account.email},
      idioma:language,
      apariencia:theme,
      notificaciones:toggles,
      frecuenciaNotificaciones:frequency,
      privacidad:privacy,
      usuariosBloqueados:blockedUsers,
    };
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=url;
    anchor.download='conecta-mis-datos.json';
    anchor.click();
    URL.revokeObjectURL(url);
    flash('Copia de datos preparada');
  };
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
  const openChangePassword=()=>{
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setScreen('changePassword');
  };
  const savePassword=async()=>{
    setPasswordError('');
    if(newPassword.length<8){
      setPasswordError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if(newPassword!==confirmPassword){
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }
    setPasswordSaving(true);
    try{
      const {error}=await supabase.auth.updateUser({password:newPassword});
      if(error)throw error;
      setNewPassword('');
      setConfirmPassword('');
      flash('Contraseña actualizada');
      setScreen('security');
    }catch(error){
      setPasswordError(error instanceof Error?error.message:'No se ha podido cambiar la contraseña.');
    }finally{
      setPasswordSaving(false);
    }
  };

  const rootRows=useMemo(()=>buildRootSettingsItems(theme,language).filter(item=>!settingsQuery.trim()||`${item.title} ${item.subtitle}`.toLocaleLowerCase('es').includes(settingsQuery.trim().toLocaleLowerCase('es'))),[settingsQuery,theme,language]);

  if(screen==='account')return <SettingsInfoScreen title="Mi cuenta" subtitle="Datos personales y preferencias" onBack={()=>setScreen('root')}>
    {accountEditing?<div className="settings-account-form">
      <label>Nombre<input value={name} onChange={event=>setName(event.target.value)} disabled={accountSaving}/></label>
      <label>Email de acceso<input type="email" value={account.email} readOnly aria-readonly="true"/></label>
      {accountError&&<p className="settings-error" role="alert">{accountError}</p>}
      <div><button className="settings-inline-action" disabled={accountSaving} onClick={()=>{void saveAccount()}}>{accountSaving?'Guardando…':'Guardar'}</button><button className="settings-secondary-action" disabled={accountSaving} onClick={cancelAccount}>Cancelar</button></div>
    </div>:<><strong>{account.name}</strong><p>{account.email}</p><button className="settings-inline-action" onClick={()=>{setName(account.name);setAccountError('');setAccountEditing(true)}}>Editar datos</button></>}
    {notice&&<p className="settings-success">{notice}</p>}
  </SettingsInfoScreen>;

  if(screen==='appearance')return <SettingsInfoScreen title="Apariencia" subtitle="Personaliza tu CONECTA" onBack={()=>setScreen('root')}>
    <div className="settings-section-heading"><strong>Tema</strong><small>Elige cómo quieres ver la aplicación</small></div>
    <div className="settings-choice-grid">{appearanceOptions.map(value=><button key={value} className={theme===value?'is-active':''} onClick={()=>setTheme(value)}>{value}</button>)}</div>
    <div className="settings-section-heading"><strong>Color principal</strong><small>El color se aplica a los controles de Ajustes</small></div>
    <div className="settings-accent-grid">{['Violeta','Azul','Rosa','Rojo','Naranja','Verde'].map(value=><button key={value} className={accent===value?'is-active':''} data-accent-choice={value.toLowerCase()} aria-label={value} title={value} onClick={()=>setAccent(value)}/>)}</div>
    <div className="settings-block">
      <SettingsToggleRow label="Texto grande" sublabel="Aumenta la legibilidad de la interfaz" checked={largeText} onToggle={()=>setLargeText(v=>!v)}/>
      <SettingsToggleRow label="Alto contraste" sublabel="Refuerza bordes y contraste visual" checked={highContrast} onToggle={()=>setHighContrast(v=>!v)}/>
      <SettingsToggleRow label="Vista compacta" sublabel="Muestra más contenido en pantalla" checked={compactView} onToggle={()=>setCompactView(v=>!v)}/>
      <SettingsToggleRow label="Reducir animaciones" sublabel="Reduce movimientos y transiciones" checked={reducedMotion} onToggle={()=>setReducedMotion(v=>!v)}/>
    </div>
  </SettingsInfoScreen>;

  if(screen==='language')return <SettingsInfoScreen title="Idioma" subtitle="Idioma de la aplicación" onBack={()=>setScreen('root')}>
    <div className="settings-language-list">{languageOptions.map(value=><button key={value} className={language===value?'is-active':''} onClick={()=>setLanguage(value)}><span>{value==='Español'?'🇪🇸':value==='Català'?'🏴':value==='English'?'🇬🇧':value==='Français'?'🇫🇷':value==='Deutsch'?'🇩🇪':value==='Italiano'?'🇮🇹':'🇵🇹'}</span><strong>{value}</strong><i aria-hidden="true">{language===value?'✓':''}</i></button>)}</div>
    <p>Idioma seleccionado: <strong>{language}</strong></p>
    <p>La preferencia se conserva en tu experiencia de CONECTA.</p>
  </SettingsInfoScreen>;

  if(screen==='about')return <SettingsInfoScreen title="Sobre CONECTA" subtitle="Información de la aplicación" onBack={()=>setScreen('root')}><strong>CONECTA 2.0.0</strong><p>Planes reales, gente compatible. Prototipo de la experiencia CONECTA.</p></SettingsInfoScreen>;

  if(screen==='helpDetail'&&helpItem)return <SettingsInfoScreen title={helpItem.title} subtitle="Centro de ayuda" onBack={()=>setScreen('help')}><p>{helpItem.body}</p></SettingsInfoScreen>;

  if(screen==='actionDetail'&&actionItem)return <SettingsInfoScreen title={actionItem.title} subtitle="Información" onBack={()=>setScreen(actionReturnScreen)}><p>{actionItem.body}</p></SettingsInfoScreen>;

  if(screen==='supportForm')return <SettingsInfoScreen title={supportKind==='help'?'Soporte técnico':'Enviar feedback'} subtitle={supportKind==='help'?'Contacta con el equipo de CONECTA':'Ayúdanos a mejorar CONECTA'} onBack={()=>setScreen('help')}>
    <div className="settings-account-form settings-support-form">
      <label>Asunto<input value={supportSubject} maxLength={120} disabled={supportSaving} onChange={event=>setSupportSubject(event.target.value)}/></label>
      <label>Mensaje<textarea value={supportMessage} maxLength={4000} disabled={supportSaving} placeholder="Cuéntanos qué necesitas o qué mejorarías…" onChange={event=>setSupportMessage(event.target.value)}/></label>
      <small className="settings-field-hint">La solicitud se envía de forma segura desde tu cuenta de CONECTA.</small>
      {supportError&&<p className="settings-error" role="alert">{supportError}</p>}
      <div><button className="settings-inline-action" disabled={supportSaving} onClick={()=>{void sendSupport()}}>{supportSaving?'Enviando…':'Enviar'}</button><button className="settings-secondary-action" disabled={supportSaving} onClick={()=>setScreen('help')}>Cancelar</button></div>
    </div>
  </SettingsInfoScreen>;

  if(screen==='security')return <SecuritySettingsScreen email={account.email} signingOut={signingOut} notice={notice} onBack={()=>setScreen('root')} onChangePassword={openChangePassword} onOpenAction={(title,body)=>openAction(title,body,'security')} onSignOutAll={()=>{void signOutAll()}}/>;

  if(screen==='changePassword')return <ChangePasswordScreen newPassword={newPassword} confirmPassword={confirmPassword} saving={passwordSaving} error={passwordError} onBack={()=>setScreen('security')} onNewPassword={setNewPassword} onConfirmPassword={setConfirmPassword} onSave={()=>{void savePassword()}}/>;

  if(screen==='privacy')return <PrivacySettingsScreen privacy={privacy} blockedUsers={blockedUsers} notice={notice} onBack={()=>setScreen('root')} onOpenField={openPrivacyField} onOpenBlocked={()=>setScreen('blockedUsers')} onOpenData={()=>openAction('Datos y actividad','Puedes descargar una copia de las preferencias y datos del prototipo desde esta pantalla. Los datos persistidos en Supabase permanecen protegidos por las políticas de tu cuenta.','privacy')} onDownload={downloadData} onDelete={()=>openAction('Eliminar cuenta','El borrado definitivo no está activado todavía. No se realizará ninguna eliminación sin un flujo específico de confirmación y borrado seguro en backend.','privacy')}/>;

  if(screen==='privacyField'&&privacyField)return <PrivacyFieldScreen field={privacyField} privacy={privacy} notice={notice} onBack={()=>setScreen('privacy')} onChange={setPrivacyValue}/>;

  if(screen==='blockedUsers')return <BlockedUsersScreen blockedUsers={blockedUsers} notice={notice} onBack={()=>setScreen('privacy')} onUnblock={unblockUser}/>;

  if(screen==='notifications')return <div className="page settings-page"><div className="settings-shell">
    <SettingsHeader title="Notificaciones" subtitle="Elige qué quieres recibir" onBack={()=>setScreen('root')}/>
    <div className="settings-block">
      <SettingsToggleRow label="Nuevos mensajes" sublabel="Cuando recibas un mensaje" checked={toggles.messages} onToggle={()=>toggle('messages')}/>
      <SettingsToggleRow label="Solicitudes de conexión" sublabel="Nuevas solicitudes" checked={toggles.requests} onToggle={()=>toggle('requests')}/>
      <SettingsToggleRow label="Actualizaciones de planes" sublabel="Cambios en tus planes" checked={toggles.planUpdates} onToggle={()=>toggle('planUpdates')}/>
      <SettingsToggleRow label="Recordatorios" sublabel="Avisos de tus próximos planes" checked={toggles.reminders} onToggle={()=>toggle('reminders')}/>
      <SettingsToggleRow label="Novedades de la app" sublabel="Noticias y mejoras" checked={toggles.news} onToggle={()=>toggle('news')}/>
      <SettingsToggleRow label="Ofertas y promociones" sublabel="Solo para usuarios Premium" checked={toggles.offers} onToggle={()=>toggle('offers')}/>
    </div>
    <div className="settings-block">
      <div className="settings-block-title">Frecuencia</div>
      {notificationFrequencyOptions.map(([key,title,subtitle])=><button key={key} className={`settings-frequency-option ${frequency===key?'is-active':''}`} onClick={()=>setFrequency(key)}><span className="settings-frequency-copy"><strong>{title}</strong><small>{subtitle}</small></span><span className="settings-radio"><span/></span></button>)}
    </div>
  </div></div>;

  if(screen==='help')return <div className="page settings-page"><div className="settings-shell">
    <SettingsHeader title="Centro de ayuda" subtitle="Guías, soporte y contacto" onBack={()=>setScreen('root')}/>
    <div className="settings-list-card">
      <SettingsRow icon={CircleHelp} title="Guía de CONECTA" subtitle="Cómo usar la app" onClick={()=>openHelp('Guía de CONECTA','Descubre planes, únete a actividades, conoce personas compatibles y gestiona tus conexiones desde una sola app.')}/>
      <SettingsRow icon={ShieldCheck} title="Normas de la comunidad" subtitle="Nuestras reglas" onClick={()=>openHelp('Normas de la comunidad','Respeto, seguridad y convivencia. No se permite acoso, suplantación ni contenido que ponga en riesgo a otros usuarios.')}/>
      <SettingsRow icon={BadgeCheck} title="Seguridad en la app" subtitle="Consejos y buenas prácticas" onClick={()=>openHelp('Seguridad en la app','Queda siempre en lugares públicos, revisa los perfiles y utiliza las herramientas de bloqueo y reporte si algo no te convence.')}/>
      <SettingsRow icon={LockKeyhole} title="Privacidad" subtitle="Cómo protegemos tus datos" onClick={()=>openHelp('Privacidad','Desde Privacidad puedes controlar quién ve tu perfil, tus planes y quién puede enviarte mensajes.')}/>
      <SettingsRow icon={Database} title="Condiciones de uso" subtitle="Términos y condiciones" onClick={()=>openHelp('Condiciones de uso','Consulta aquí las condiciones que regulan el uso de CONECTA. Este prototipo aún no sustituye los textos legales definitivos.')}/>
      <SettingsRow icon={Mail} title="Soporte técnico" subtitle="Enviar solicitud dentro de CONECTA" onClick={()=>openSupport('help')}/>
      <SettingsRow icon={MessageCircleMore} title="Enviar feedback" subtitle="Cuéntanos tu opinión" onClick={()=>openSupport('improvement')}/>
    </div>
    <div className="settings-support-box"><div><strong>¿Necesitas ayuda?</strong><small>Nuestro equipo está aquí para ti.</small></div><button onClick={()=>openSupport('help')}>Contactar soporte</button></div>
    {notice&&<p className="settings-success">{notice}</p>}
  </div></div>;

  if(screen==='premium')return <div className="page settings-page"><div className="settings-shell">
    <SettingsHeader title="Conecta Premium" subtitle="Más planes. Más personas. Más vida." onBack={()=>setScreen('root')}/>
    <PremiumContent requested={premiumStarted} onRequest={()=>setPremiumStarted(true)}/>
  </div></div>;

  return <div className="page settings-page"><div className="settings-shell">
    <SettingsHeader title="Ajustes" subtitle="Personaliza tu experiencia en CONECTA"/>
    <section className="settings-profile-hero">
      <div className="settings-profile-avatar" aria-hidden="true">{account.name.trim().slice(0,1).toUpperCase()||'C'}</div>
      <div className="settings-profile-copy"><strong>{account.name}</strong><small>{account.email}</small><button onClick={()=>setScreen('account')}>Ver y editar tu perfil</button></div>
      <ChevronRight className="settings-profile-chevron"/>
      <button className="settings-hero-premium" onClick={()=>setScreen('premium')}><span className="settings-premium-entry-card"><span className="settings-premium-entry-chip"/></span><span><strong>CONECTA Premium</strong><small>Más funciones, más planes, más conexiones</small></span><b>Ver beneficios</b></button>
    </section>
    <div className="settings-search"><input value={settingsQuery} onChange={event=>setSettingsQuery(event.target.value)} placeholder="Buscar en ajustes..." aria-label="Buscar en ajustes"/></div>
    <div className="settings-dashboard">
      {rootRows.length?rootRows.map(item=><SettingsRow key={item.title} icon={item.icon} title={item.title} subtitle={item.subtitle} onClick={()=>setScreen(item.screen)}/>):<div className="settings-empty">No hay ajustes que coincidan.</div>}
      {!settingsQuery.trim()&&<>
        <SettingsRow icon={MapPinned} title="Ubicación" subtitle="Tu ubicación en planes y mapa" onClick={()=>openPrivacyField('locationSharing')}/>
        <SettingsRow icon={UsersRound} title="Planes y eventos" subtitle="Preferencias, intereses y disponibilidad" onClick={()=>openAction('Planes y eventos','Gestiona cómo quieres descubrir planes, tus intereses, disponibilidad y preferencias para recibir recomendaciones más relevantes.')}/>
        <SettingsRow icon={ShieldCheck} title="Normas de la comunidad" subtitle="Uso responsable y comportamiento" onClick={()=>openHelp('Normas de la comunidad','Respeto, seguridad y convivencia. No se permite acoso, suplantación ni contenido que ponga en riesgo a otros usuarios.')}/>
      </>}
    </div>
    <button className="settings-premium-entry" onClick={()=>setScreen('premium')}><div className="settings-premium-entry-card"><div className="settings-premium-entry-chip"/></div><div className="settings-premium-entry-copy"><strong>Conecta Premium</strong><small>Gestiona tu suscripción y niveles</small></div><ChevronRight/></button>
    <button className="settings-signout-entry" disabled={signingOut} onClick={()=>{void signOutAll()}}><LogOut/><span><strong>{signingOut?'Cerrando sesión…':'Cerrar sesión'}</strong><small>Sal de tu cuenta en este dispositivo</small></span><ChevronRight/></button>
    {notice&&<p className="settings-success">{notice}</p>}
  </div></div>;
}
