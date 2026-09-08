import { Bell, CheckCircle2 } from 'lucide-react';
import { loadStored, storageKeys } from '../lib/storage';
import type { ToggleKey } from '../types';

const defaultToggles:Record<ToggleKey,boolean>={messages:true,requests:true,planUpdates:true,reminders:true,news:true,offers:true};
const notifications:[ToggleKey,string,string,string][] = [
  ['planUpdates','Plan actualizado','Pádel Sunset cambia su hora a las 19:30.','Hace 10 min'],
  ['requests','Nueva conexión','Marta ha aceptado tu solicitud de conexión.','Hace 1 h'],
  ['reminders','Recordatorio','Running por la costa empieza mañana a las 09:00.','Hace 3 h'],
  ['messages','Grupo activo','Hay nuevos mensajes en Viaje a Madrid.','Ayer']
];

export function NotificationsView(){
  const toggles=loadStored<Record<ToggleKey,boolean>>(storageKeys.notificationToggles,defaultToggles);
  const visible=notifications.filter(([key])=>toggles[key]);
  return <div className="page notifications-page">
    <div className="page-title"><div><h1>Notificaciones</h1><p>Todo lo importante de tu actividad en CONECTA</p></div><span className="page-title-icon"><Bell/></span></div>
    {visible.length?<div className="notification-list">{visible.map(([,title,body,time],i)=><article key={title} className={i===0?'is-new':''}><span className="notification-icon"><CheckCircle2/></span><div><strong>{title}</strong><p>{body}</p><small>{time}</small></div></article>)}</div>:<div className="empty-state">Has desactivado estas notificaciones desde Ajustes.</div>}
  </div>
}
