import { Database, Download, LogOut, UserX } from 'lucide-react';
import type { BlockedUser, PrivacyFieldKey, PrivacySettings } from '../../types';
import { SettingsHeader, SettingsInfoScreen, SettingsRow } from './SettingsPrimitives';
import { privacyFieldMeta, privacyFieldOrder } from './settingsCatalog';

type PrivacyChangeHandler=<K extends PrivacyFieldKey>(key:K,value:PrivacySettings[K])=>void;

export function PrivacySettingsScreen({privacy,blockedUsers,notice,onBack,onOpenField,onOpenBlocked,onOpenData,onDownload,onDelete}:{privacy:PrivacySettings;blockedUsers:BlockedUser[];notice:string;onBack:()=>void;onOpenField:(key:PrivacyFieldKey)=>void;onOpenBlocked:()=>void;onOpenData:()=>void;onDownload:()=>void;onDelete:()=>void}){
  return <div className="page settings-page">
    <div className="settings-shell">
      <SettingsHeader title="Privacidad" subtitle="Tú decides qué compartir" onBack={onBack}/>
      <div className="settings-list-card">
        {privacyFieldOrder.map(key=>{
          const meta=privacyFieldMeta[key];
          return <SettingsRow key={key} icon={meta.icon} title={meta.title} subtitle={privacy[key]} onClick={()=>onOpenField(key)}/>;
        })}
        <SettingsRow icon={UserX} title="Usuarios bloqueados" subtitle={blockedUsers.length?`${blockedUsers.length} bloqueado${blockedUsers.length===1?'':'s'}`:'Ninguno por ahora'} onClick={onOpenBlocked}/>
        <SettingsRow icon={Database} title="Datos y actividad" subtitle="Gestiona tu información" onClick={onOpenData}/>
        <SettingsRow icon={Download} title="Descargar mis datos" subtitle="Recibe una copia de tu información" onClick={onDownload}/>
        <SettingsRow icon={LogOut} title="Eliminar cuenta" subtitle="Elimina tu cuenta y todos tus datos" danger onClick={onDelete}/>
      </div>
      {notice&&<p className="settings-success">{notice}</p>}
    </div>
  </div>;
}

export function PrivacyFieldScreen({field,privacy,notice,onBack,onChange}:{field:PrivacyFieldKey;privacy:PrivacySettings;notice:string;onBack:()=>void;onChange:PrivacyChangeHandler}){
  const meta=privacyFieldMeta[field];
  const current=privacy[field];
  return <SettingsInfoScreen title={meta.title} subtitle={meta.subtitle} onBack={onBack}>
    <p>{meta.description}</p>
    <div className="settings-choice-grid">
      {meta.options.map(value=><button key={value} className={current===value?'is-active':''} onClick={()=>onChange(field,value)}>{value}</button>)}
    </div>
    <p>Preferencia actual: <strong>{current}</strong></p>
    {notice&&<p className="settings-success">{notice}</p>}
  </SettingsInfoScreen>;
}

export function BlockedUsersScreen({blockedUsers,notice,onBack,onUnblock}:{blockedUsers:BlockedUser[];notice:string;onBack:()=>void;onUnblock:(userId:string)=>void}){
  return <div className="page settings-page">
    <div className="settings-shell">
      <SettingsHeader title="Usuarios bloqueados" subtitle="Gestiona quién no puede contactarte" onBack={onBack}/>
      {blockedUsers.length?<div className="settings-list-card">
        {blockedUsers.map(user=><SettingsRow key={user.userId} icon={UserX} title={user.name} subtitle="Toca para desbloquear" danger onClick={()=>onUnblock(user.userId)}/>)}
      </div>:<div className="settings-info-card"><p>No has bloqueado a nadie todavía. Cuando bloquees a una persona desde su perfil, aparecerá aquí y podrás desbloquearla cuando quieras.</p></div>}
      {notice&&<p className="settings-success">{notice}</p>}
    </div>
  </div>;
}
