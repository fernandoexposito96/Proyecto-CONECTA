import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function SettingsHeader({title,subtitle,onBack}:{title:string;subtitle:string;onBack?:()=>void}){
  return <div className="settings-header">
    {onBack?<button className="settings-back" onClick={onBack} aria-label="Volver"><ChevronLeft/></button>:<span className="settings-back placeholder"/>}
    <div className="settings-header-copy"><h1>{title}</h1><p>{subtitle}</p></div>
    <span className="settings-back placeholder"/>
  </div>;
}

export function SettingsRow({icon:Icon,title,subtitle,onClick,danger=false}:{icon:LucideIcon;title:string;subtitle:string;onClick?:()=>void;danger?:boolean}){
  return <button className={`settings-row ${danger?'is-danger':''}`} onClick={onClick}>
    <span className="settings-row-icon"><Icon/></span>
    <span className="settings-row-copy"><strong>{title}</strong><small>{subtitle}</small></span>
    <ChevronRight/>
  </button>;
}

export function SettingsToggleRow({label,sublabel,checked,onToggle}:{label:string;sublabel:string;checked:boolean;onToggle:()=>void}){
  return <div className="settings-toggle-row">
    <div className="settings-toggle-copy"><strong>{label}</strong><small>{sublabel}</small></div>
    <button className={`settings-switch ${checked?'is-on':''}`} onClick={onToggle} aria-pressed={checked} aria-label={`${label}: ${checked?'activado':'desactivado'}`}><span/></button>
  </div>;
}

export function SettingsInfoScreen({title,subtitle,children,onBack}:{title:string;subtitle:string;children:ReactNode;onBack:()=>void}){
  return <div className="page settings-page">
    <div className="settings-shell">
      <SettingsHeader title={title} subtitle={subtitle} onBack={onBack}/>
      <div className="settings-info-card">{children}</div>
    </div>
  </div>;
}
