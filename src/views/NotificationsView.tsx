import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { fetchBackendNotifications, fetchUnreadNotificationCount, markBackendNotificationRead } from '../lib/notificationsBackend';
import { loadStored, storageKeys } from '../lib/storage';
import type { ToggleKey } from '../types';

const defaultToggles:Record<ToggleKey,boolean>={messages:true,requests:true,planUpdates:true,reminders:true,news:true,offers:true};

type NotificationItem={
  id:string;
  toggleKey:ToggleKey;
  title:string;
  body:string;
  time:string;
  read:boolean;
  backend:boolean;
};

const demoNotifications:NotificationItem[]=[
  {id:'demo-plan',toggleKey:'planUpdates',title:'Plan actualizado',body:'Pádel Sunset cambia su hora a las 19:30.',time:'Hace 10 min',read:false,backend:false},
  {id:'demo-request',toggleKey:'requests',title:'Nueva conexión',body:'Marta ha aceptado tu solicitud de conexión.',time:'Hace 1 h',read:true,backend:false},
  {id:'demo-reminder',toggleKey:'reminders',title:'Recordatorio',body:'Running por la costa empieza mañana a las 09:00.',time:'Hace 3 h',read:true,backend:false},
  {id:'demo-message',toggleKey:'messages',title:'Grupo activo',body:'Hay nuevos mensajes en Viaje a Madrid.',time:'Ayer',read:true,backend:false},
];

function toggleForType(type:string):ToggleKey{
  const value=type.trim().toLocaleLowerCase('es');
  if(value.includes('message')||value.includes('chat')||value.includes('mensaje'))return 'messages';
  if(value.includes('connection')||value.includes('request')||value.includes('conex'))return 'requests';
  if(value.includes('reminder')||value.includes('recordatorio'))return 'reminders';
  if(value.includes('plan')||value.includes('event'))return 'planUpdates';
  if(value.includes('offer')||value.includes('promo'))return 'offers';
  return 'news';
}

function relativeTime(value:string){
  const timestamp=Date.parse(value);
  if(!Number.isFinite(timestamp))return '';
  const seconds=Math.max(0,Math.floor((Date.now()-timestamp)/1000));
  if(seconds<60)return 'Ahora';
  const minutes=Math.floor(seconds/60);
  if(minutes<60)return `Hace ${minutes} min`;
  const hours=Math.floor(minutes/60);
  if(hours<24)return `Hace ${hours} h`;
  const days=Math.floor(hours/24);
  if(days===1)return 'Ayer';
  if(days<7)return `Hace ${days} días`;
  return new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'short'}).format(new Date(timestamp));
}

export function NotificationsView({onUnreadCountChange}:{onUnreadCountChange?:(count:number)=>void}){
  const [toggles]=useState<Record<ToggleKey,boolean>>(()=>loadStored(storageKeys.notificationToggles,defaultToggles));
  const [items,setItems]=useState<NotificationItem[]>(demoNotifications);
  const [usingDemo,setUsingDemo]=useState(true);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const unreadRequestVersion=useRef(0);

  const refreshUnreadCount=useCallback(async()=>{
    const version=++unreadRequestVersion.current;
    const count=await fetchUnreadNotificationCount();
    if(version===unreadRequestVersion.current)onUnreadCountChange?.(count);
  },[onUnreadCountChange]);

  useEffect(()=>{
    let active=true;
    void fetchBackendNotifications()
      .then(rows=>{
        if(!active)return;
        if(rows.length){
          const mapped=rows.map(row=>({
            id:row.id,
            toggleKey:toggleForType(row.type),
            title:row.title,
            body:row.body,
            time:relativeTime(row.createdAt),
            read:row.read,
            backend:true,
          } satisfies NotificationItem));
          setItems(mapped);
          setUsingDemo(false);
        }else{
          setItems(demoNotifications);
          setUsingDemo(true);
        }
        setError('');
      })
      .catch(loadError=>{
        if(!active)return;
        console.warn('CONECTA notifications load failed; demo fallback kept',loadError);
        setItems(demoNotifications);
        setUsingDemo(true);
        setError('No se han podido actualizar las notificaciones reales. Mostramos el demo como respaldo.');
      })
      .finally(()=>{if(active)setLoading(false)});

    void refreshUnreadCount().catch(countError=>{
      console.warn('CONECTA unread notification count refresh failed',countError);
    });

    return ()=>{active=false;unreadRequestVersion.current+=1};
  },[refreshUnreadCount]);

  const visible=useMemo(()=>items.filter(item=>toggles[item.toggleKey]),[items,toggles]);

  const markRead=(item:NotificationItem)=>{
    if(item.read)return;
    setItems(current=>current.map(entry=>entry.id===item.id?{...entry,read:true}:entry));
    if(!item.backend)return;

    void (async()=>{
      try{
        await markBackendNotificationRead(item.id);
        setError('');
      }catch(markError){
        console.warn('CONECTA notification read sync failed',markError);
        setItems(current=>current.map(entry=>entry.id===item.id?{...entry,read:false}:entry));
        setError('No se ha podido marcar la notificación como leída.');
      }finally{
        try{
          await refreshUnreadCount();
        }catch(countError){
          console.warn('CONECTA unread notification count refresh failed',countError);
        }
      }
    })();
  };

  return <div className="page notifications-page">
    <div className="page-title"><div><h1>Notificaciones</h1><p>Todo lo importante de tu actividad en CONECTA</p></div><span className="page-title-icon"><Bell/></span></div>
    {loading&&<div className="empty-state">Actualizando notificaciones…</div>}
    {!loading&&error&&<div className="notification-status" role="status">{error}</div>}
    {!loading&&usingDemo&&!error&&<div className="notification-status">Aún no tienes notificaciones reales. Conservamos el demo para que puedas revisar la experiencia.</div>}
    {!loading&&(visible.length?<div className="notification-list">{visible.map(item=><button key={item.id} type="button" className={`notification-card ${item.read?'':'is-new'}`} onClick={()=>markRead(item)} aria-label={`${item.title}. ${item.read?'Leída':'Marcar como leída'}`}>
      <span className="notification-icon"><CheckCircle2/></span><span className="notification-copy"><strong>{item.title}</strong><span>{item.body}</span><small>{item.time}</small></span>
    </button>)}</div>:<div className="empty-state">Has desactivado estas notificaciones desde Ajustes.</div>)}
  </div>
}
