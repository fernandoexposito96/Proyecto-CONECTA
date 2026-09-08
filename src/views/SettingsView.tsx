import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ChevronRight, CircleHelp, Database, LockKeyhole, Mail, MessageCircleMore, ShieldCheck } from 'lucide-react';
import { accountFromUser, demoAccount } from '../lib/identity';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import { supabase } from '../lib/supabase';
import type { AccountSettings, ActionItem, BlockedUser, HelpItem, Language, NotificationFrequency, PrivacyFieldKey, PrivacySettings, SettingsScreen, Theme, ToggleKey } from '../types';
import { BlockedUsersScreen, PrivacyFieldScreen, PrivacySettingsScreen } from './settings/PrivacySettingsScreens';
import { ChangePasswordScreen, SecuritySettingsScreen } from './settings/SecuritySettingsScreens';
import { SettingsHeader, SettingsInfoScreen, SettingsRow, SettingsToggleRow } from './settings/SettingsPrimitives';
import { appearanceOptions, buildRootSettingsItems, defaultPrivacy, languageOptions, notificationFrequencyOptions, premiumBenefits } from './settings/settingsCatalog';

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
  const [signingOut,setSigningOut]=useState(false);
  const [privacy,setPrivacy]=useState<PrivacySettings>(()=>loadStored(storageKeys.privacySettings,defaultPrivacy));
  const [privacyField,setPrivacyField]=useState<PrivacyFieldKey|null>(null);
  const [blockedUsers,setBlockedUsers]=useState<BlockedUser[]>(loadBlockedUsers);
  const [newPassword,setNewPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [passwordSaving,setPasswordSaving]=useState(false);
  const [passwordError,setPasswordError]=useState('');

  useEffect(()=>{
    let active=true;
    void supabase.auth.getUser().then(({data})=>{
      if(!active)return;
      const stored=loadStored<AccountSettings>(storageKeys.settingsAccount,demoAccount);
      const next=accountFromUser(data.user,stored);
      setAccount(next);
      setName(next.name);
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
  useEffect(()=>{saveStored(storageKeys.privacySettings,privacy)},[privacy]);
  useEffect(()=>{saveStored(storageKeys.blockedUsers,blockedUsers)},[blockedUsers]);

  const flash=(text:string)=>{
    setNotice(text);
    window.setTimeout(()=>setNotice(''),2200);
  };
  const toggle=(key:ToggleKey)=>setToggles(value=>({...value,[key]:!value[key]}));
  const saveAccount=()=>{
    const next={name:name.trim()||account.name,email:account.email};
    setAccount(next);
    setName(next.name);
    setAccountEditing(false);
    flash('Datos guardados');
  };
  const cancelAccount=()=>{
    setName(account.name);
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
  const openPrivacyField=(key:PrivacyFieldKey)=>{
    setPrivacyField(key);
    setScreen('privacyField');
  };
  const setPrivacyValue=<K extends PrivacyFieldKey>(key:K,value:PrivacySettings[K])=>{
    setPrivacy(current=>({...current,[key]:value}));
    flash('Preferencia guardada');
  };
  const unblockUser=(userId:string)=>{
    const user=blockedUsers.find(item=>item.userId===userId);
    setBlockedUsers(current=>current.filter(item=>item.userId!==userId));
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
      <label>Nombre<input value={name} onChange={event=>setName(event.target.value)}/></label>
      <label>Email de acceso<input type="email" value={account.email} readOnly aria-readonly="true"/></label>
      <div><button className="settings-inline-action" onClick={saveAccount}>Guardar</button><button className="settings-secondary-action" onClick={cancelAccount}>Cancelar</button></div>
    </div>:<><strong>{account.name}</strong><p>{account.email}</p><button className="settings-inline-action" onClick={()=>{setName(account.name);setAccountEditing(true)}}>Editar datos</button></>}
    {notice&&<p className="settings-success">{notice}</p>}
  </SettingsInfoScreen>;

  if(screen==='appearance')return <SettingsInfoScreen title="Apariencia" subtitle="Elige cómo quieres ver CONECTA" onBack={()=>setScreen('root')}>
    <div className="settings-choice-grid">{appearanceOptions.map(value=><button key={value} className={theme===value?'is-active':''} onClick={()=>setTheme(value)}>{value}</button>)}</div>
    <p>Preferencia actual: <strong>{theme}</strong></p>
  </SettingsInfoScreen>;

  if(screen==='language')return <SettingsInfoScreen title="Idioma" subtitle="Idioma de la aplicación" onBack={()=>setScreen('root')}>
    <div className="settings-choice-grid">{languageOptions.map(value=><button key={value} className={language===value?'is-active':''} onClick={()=>setLanguage(value)}>{value}</button>)}</div>
    <p>Idioma seleccionado: <strong>{language}</strong></p>
    <p>La preferencia se conserva en tu experiencia de CONECTA.</p>
  </SettingsInfoScreen>;

  if(screen==='about')return <SettingsInfoScreen title="Sobre CONECTA" subtitle="Información de la aplicación" onBack={()=>setScreen('root')}><strong>CONECTA 2.0.0</strong><p>Planes reales, gente compatible. Prototipo de la experiencia CONECTA.</p></SettingsInfoScreen>;

  if(screen==='helpDetail'&&helpItem)return <SettingsInfoScreen title={helpItem.title} subtitle="Centro de ayuda" onBack={()=>setScreen('help')}><p>{helpItem.body}</p></SettingsInfoScreen>;

  if(screen==='actionDetail'&&actionItem)return <SettingsInfoScreen title={actionItem.title} subtitle="Configuración" onBack={()=>setScreen(actionReturnScreen)}><p>{actionItem.body}</p><button className="settings-inline-action" onClick={()=>flash('Cambio guardado en el prototipo')}>Guardar preferencia</button>{notice&&<p className="settings-success">{notice}</p>}</SettingsInfoScreen>;

  if(screen==='security')return <SecuritySettingsScreen email={account.email} signingOut={signingOut} notice={notice} onBack={()=>setScreen('root')} onChangePassword={openChangePassword} onOpenAction={(title,body)=>openAction(title,body,'security')} onSignOutAll={()=>{void signOutAll()}}/>;

  if(screen==='changePassword')return <ChangePasswordScreen newPassword={newPassword} confirmPassword={confirmPassword} saving={passwordSaving} error={passwordError} onBack={()=>setScreen('security')} onNewPassword={setNewPassword} onConfirmPassword={setConfirmPassword} onSave={()=>{void savePassword()}}/>;

  if(screen==='privacy')return <PrivacySettingsScreen privacy={privacy} blockedUsers={blockedUsers} notice={notice} onBack={()=>setScreen('root')} onOpenField={openPrivacyField} onOpenBlocked={()=>setScreen('blockedUsers')} onOpenData={()=>openAction('Datos y actividad','Revisa la información y actividad asociada a tu perfil. La siguiente fase conectará este resumen con los datos persistidos en tu cuenta.','privacy')} onDownload={downloadData} onDelete={()=>openAction('Eliminar cuenta','El borrado definitivo se mantiene protegido mientras terminamos el flujo de confirmación y eliminación segura en backend.','privacy')}/>;

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
      <SettingsRow icon={Mail} title="Soporte técnico" subtitle="soporte@conectaapp.com" onClick={()=>window.location.href='mailto:soporte@conectaapp.com?subject=Soporte%20CONECTA'}/>
      <SettingsRow icon={MessageCircleMore} title="Enviar feedback" subtitle="Cuéntanos tu opinión" onClick={()=>window.location.href='mailto:soporte@conectaapp.com?subject=Feedback%20CONECTA'}/>
    </div>
    <div className="settings-support-box"><div><strong>¿Necesitas ayuda?</strong><small>Nuestro equipo está aquí para ti.</small></div><button onClick={()=>window.location.href='mailto:soporte@conectaapp.com?subject=Ayuda%20CONECTA'}>Contactar soporte</button></div>
  </div></div>;

  if(screen==='premium')return <div className="page settings-page"><div className="settings-shell">
    <SettingsHeader title="Conecta Premium" subtitle="Más planes. Más personas. Más vida." onBack={()=>setScreen('root')}/>
    <div className="premium-hero-card"><div className="premium-card-visual"><div className="premium-card-chip"/><div className="premium-card-brand">CONECTA</div></div><div className="premium-hero-copy"><h2>Vive más experiencias</h2><p>Conecta Premium te da acceso a más oportunidades para hacer planes y conocer gente increíble.</p></div></div>
    <div className="premium-benefits-list">{premiumBenefits.map(([number,title,subtitle])=><div key={number} className="premium-benefit-row"><span className="premium-number">{number}</span><div><strong>{title}</strong><small>{subtitle}</small></div></div>)}</div>
    <button className="premium-main-cta" onClick={()=>setPremiumStarted(true)}>{premiumStarted?'Solicitud iniciada':'Hazte Premium'} <ChevronRight/></button>
    {premiumStarted&&<p className="settings-success">Perfecto. El siguiente paso será conectar aquí el pago real cuando activemos esa función.</p>}
    <p className="premium-footnote">Desde 4,99 €/mes · Cancela cuando quieras</p>
  </div></div>;

  return <div className="page settings-page"><div className="settings-shell">
    <SettingsHeader title="Ajustes" subtitle="Personaliza tu experiencia en CONECTA"/>
    <div className="settings-search"><input value={settingsQuery} onChange={event=>setSettingsQuery(event.target.value)} placeholder="Buscar en ajustes..." aria-label="Buscar en ajustes"/></div>
    <div className="settings-list-card">{rootRows.length?rootRows.map(item=><SettingsRow key={item.title} icon={item.icon} title={item.title} subtitle={item.subtitle} onClick={()=>setScreen(item.screen)}/>):<div className="settings-empty">No hay ajustes que coincidan.</div>}</div>
    <button className="settings-premium-entry" onClick={()=>setScreen('premium')}><div className="settings-premium-entry-card"><div className="settings-premium-entry-chip"/></div><div className="settings-premium-entry-copy"><strong>Conecta Premium</strong><small>Vive más experiencias</small></div><ChevronRight/></button>
  </div></div>;
}
