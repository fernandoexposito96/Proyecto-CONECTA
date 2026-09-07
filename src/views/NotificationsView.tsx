import { Bell, CheckCircle2 } from 'lucide-react';

const notifications = [
  ['Plan actualizado','Pádel Sunset cambia su hora a las 19:30.','Hace 10 min'],
  ['Nueva conexión','Marta ha aceptado tu solicitud de conexión.','Hace 1 h'],
  ['Recordatorio','Running por la costa empieza mañana a las 09:00.','Hace 3 h'],
  ['Grupo activo','Hay nuevos mensajes en Viaje a Madrid.','Ayer']
] as const;

export function NotificationsView(){
  return <div className="page notifications-page">
    <div className="page-title"><div><h1>Notificaciones</h1><p>Todo lo importante de tu actividad en CONECTA</p></div><span className="page-title-icon"><Bell/></span></div>
    <div className="notification-list">{notifications.map(([title,body,time],i)=><article key={title} className={i===0?'is-new':''}><span className="notification-icon"><CheckCircle2/></span><div><strong>{title}</strong><p>{body}</p><small>{time}</small></div></article>)}</div>
  </div>
}
