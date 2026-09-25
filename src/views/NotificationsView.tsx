import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCircle2, CheckCheck, MessageCircle } from 'lucide-react';
import { fetchBackendNotifications, markAllBackendNotificationsRead, markBackendNotificationRead } from '../lib/notificationsBackend';
import { loadStored, storageChangeEvent, storageKeys } from '../lib/storage';
import type { ToggleKey } from '../types';
import { supabase } from '../lib/supabase';

const defaultToggles:Record<ToggleKey,boolean>={messages:true,requests:true,planUpdates:true,reminders:true,news:true,offers:true};

type NotificationItem={id:string;toggleKey:ToggleKey;backendType:string;title:string;body:string;time:string;read:boolean;backend:boolean;entityType:string|null;entityId:string|null;};

const demoNotifications:NotificationItem[]=[
  {id:'demo-plan',toggleKey:'planUpdates',backendType:'demo',title:'Plan actualizado',body:'Pádel Sunset cambia su hora a las 19:30.',time:'Hace 10 min',read:false,backend:false,entityType:null,entityId:null},
  {id:'demo-request',toggleKey:'requests',backendType:'demo',title:'Nueva conexión',body:'Marta ha aceptado tu solicitud de conexión.',time:'Hace 1 h',read:true,backend:false,entityType:null,entityId:null},
  {id:'demo-reminder',toggleKey:'reminders',backendType:'demo',title:'Recordatorio',body:'Running por la costa empieza mañana a las 09:00.',time:'Hace 3 h',read:true,backend:false,entityType:null,entityId:null},
  {id:'demo-message',toggleKey:'messages',backendType:'demo',title:'Grupo activo',body:'Hay nuevos mensajes en Viaje a Madrid.',time:'Ayer',read:true,backend:false,entityType:null,entityId:null},
];

function toggleForType(type:string):ToggleKey{const value=type.trim().toLocaleLowerCase('es');if(value.includes('message')||value.includes('chat')||value.includes('mensaje'))return 'messages';if(value.includes('connection')||value.includes('request')||value.includes('conex'))return 'requests';if(value.includes('reminder')||value.includes('recordatorio'))return 'reminders';if(value.includes('plan')||value.includes('event'))return 'planUpdates';if(value.includes('offer')||value.includes('promo'))return 'offers';return 'news';}
function relativeTime(value:string){const timestamp=Date.parse(value);if(!Number.isFinite(timestamp))return '';const seconds=Math.max(0,Math.floor((Date.now()-timestamp)/1000));if(seconds<60)return 'Ahora';const minutes=Math.floor(seconds/60);if(minutes<60)return `Hace ${minutes} min`;const hours=Math.floor(minutes/60);if(hours<24)return `Hace ${hours} h`;const days=Math.floor(hours/24);if(days===1)return 'Ayer';if(days<7)return `Hace ${days} días`;return new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'short'}).format(new Date(timestamp));}

export function NotificationsView({onUnreadCountChange,onOpenPlanChat}:{onUnreadCountChange?:(count:number)=>void;onOpenPlanChat?:(planId:string)=>void}){
  const [toggles,setToggles]=useState<Record<ToggleKey,boolean>>(()=>loadStored(storageKeys.notificationToggles,defaultToggles));
  const [items,setItems]=useState<NotificationItem[]>(demoNotifications);
  const [usingDemo,setUsingDemo]=useState(true);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [markingAll,setMarkingAll]=useState(false);
  const unreadRequestVersion=useRef(0);

  const refreshUnreadCount=useCallback(async()=>{const version=++unreadRequestVersion.current;const rows=await fetchBackendNotifications(200);const count=rows.filter(row=>!row.read&&toggles[toggleForType(row.type)]).length;if(version===unreadRequestVersion.current)onUnreadCountChange?.(count);},[onUnreadCountChange,toggles]);

  useEffect(()=>{const refreshToggles=()=>setToggles(loadStored(storageKeys.notificationToggles,defaultToggles));const onStorageChange=(event:Event)=>{const detail=(event as CustomEvent<{key?:string}>).detail;if(detail?.key===storageKeys.notificationToggles)refreshToggles();};window.addEventListener(storageChangeEvent,onStorageChange);window.addEventListener('storage',refreshToggles);return()=>{window.removeEventListener(storageChangeEvent,onStorageChange);window.removeEventListener('storage',refreshToggles);};},[]);

  useEffect(()=>{let active=true;void fetchBackendNotifications().then(rows=>{if(!active)return;if(rows.length){setItems(rows.map(row=>({id:row.id,toggleKey:toggleForType(row.type),backendType:row.type,title:row.title,body:row.body,time:relativeTime(row.createdAt),read:row.read,backend:true,entityType:row.entityType,entityId:row.entityId} satisfies NotificationItem)));setUsingDemo(false);}else{setItems(demoNotifications);setUsingDemo(true);}setError('');}).catch(loadError=>{if(!active)return;console.warn('CONECTA notifications load failed; demo fallback kept',loadError);setItems(demoNotifications);setUsingDemo(true);setError('No se han podido actualizar las notificaciones reales. Mostramos el demo como respaldo.');}).finally(()=>{if(active)setLoading(false)});return()=>{active=false};},[]);

  useEffect(()=>{void refreshUnreadCount().catch(countError=>console.warn('CONECTA unread notification count refresh failed',countError));const channel=supabase.channel('notifications-live').on('postgres_changes',{event:'*',schema:'public',table:'notifications'},()=>{void refreshUnreadCount().catch(countError=>console.warn('CONECTA realtime unread notification refresh failed',countError));}).subscribe();return()=>{unreadRequestVersion.current+=1;void supabase.removeChannel(channel);};},[refreshUnreadCount]);

  const visible=useMemo(()=>items.filter(item=>toggles[item.toggleKey]),[items,toggles]);
  const hasUnreadBackendItems=useMemo(()=>visible.some(item=>item.backend&&!item.read),[visible]);
  const openNotificationAction=(item:NotificationItem)=>{if(item.backendType==='plan_reminder'&&item.entityType==='plan'&&item.entityId?.trim())onOpenPlanChat?.(item.entityId.trim());};
  const markRead=(item:NotificationItem)=>{if(item.read){openNotificationAction(item);return;}setItems(current=>current.map(entry=>entry.id===item.id?{...entry,read:true}:entry));openNotificationAction(item);if(!item.backend){return;}void (async()=>{try{await markBackendNotificationRead(item.id);setError('');}catch(markError){console.warn('CONECTA notification read sync failed',markError);setItems(current=>current.map(entry=>entry.id===item.id?{...entry,read:false}:entry));setError('No se ha podido marcar la notificación como leída.');}finally{try{await refreshUnreadCount();}catch(countError){console.warn('CONECTA unread notification count refresh failed',countError);}}})();};

  const markAllRead=()=>{if(markingAll||!hasUnreadBackendItems)return;const previous=items;setItems(current=>current.map(entry=>entry.backend?{...entry,read:true}:entry));setMarkingAll(true);void (async()=>{try{await markAllBackendNotificationsRead();setError('');}catch(markAllError){console.warn('CONECTA mark all notifications read failed',markAllError);setItems(previous);setError('No se han podido marcar todas las notificaciones como leídas.');}finally{setMarkingAll(false);try{await refreshUnreadCount();}catch(countError){console.warn('CONECTA unread notification count refresh failed',countError);}}})();};

  return <div className="page notifications-page"><div className="page-title"><div><h1>Notificaciones</h1><p>Todo lo importante de tu actividad en CONECTA</p></div>{!loading&&hasUnreadBackendItems&&<button type="button" className="notifications-mark-all" onClick={markAllRead} disabled={markingAll}><CheckCheck/> {markingAll?'Marcando…':'Marcar todas como leídas'}</button>}<span className="page-title-icon"><Bell/></span></div>{loading&&<div className="empty-state">Actualizando notificaciones…</div>}{!loading&&error&&<div className="notification-status" role="status">{error}</div>}{!loading&&usingDemo&&!error&&<div className="notification-status">Aún no tienes notificaciones reales. Conservamos el demo para que puedas revisar la experiencia.</div>}{!loading&&(visible.length?<div className="notification-list">{visible.map(item=>{const opensChat=item.backendType==='plan_reminder'&&item.entityType==='plan'&&Boolean(item.entityId?.trim());return <button key={item.id} type="button" className={`notification-card ${item.read?'':'is-new'}`} onClick={()=>markRead(item)} aria-label={`${item.title}. ${opensChat?'Abrir chat del plan':item.read?'Leída':'Marcar como leída'}`}><span className="notification-icon">{opensChat?<MessageCircle/>:<CheckCircle2/>}</span><span className="notification-copy"><strong>{item.title}</strong><span>{item.body}</span><small>{item.time}{opensChat?' · Abrir chat del plan':''}</small></span></button>})}</div>:<div className="empty-state">Has desactivado estas notificaciones desde Ajustes.</div>)}</div>;
}
