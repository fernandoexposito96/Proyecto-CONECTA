import { useEffect, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Heart, MapPin, UsersRound } from 'lucide-react';
import { usePlanFavorites } from '../hooks/usePlanFavorites';
import { blockedNames, canUseLocation, loadPrivacySettings } from '../lib/privacy';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import type { Plan } from '../types';
import { PlanFeatureTools } from './PlanFeatureTools';

export function PlanCards({items,onPlan}:{items:Plan[],onPlan:(p:Plan)=>void}){
  const {favorites,toggleFavorite}=usePlanFavorites();
  const [locationAllowed]=useState(()=>canUseLocation(loadPrivacySettings()));
  return <div className="plan-grid">{items.map((p)=><article className="plan-card" key={p.backendId||`${p.title}|${p.time}|${p.place}`} role="group" aria-label={p.title} onClick={()=>onPlan(p)}><div className="plan-image"><img loading="lazy" decoding="async" src={p.image} alt={p.title}/><button type="button" className={favorites.has(p.title)?'is-favorite':''} aria-label={favorites.has(p.title)?'Quitar de favoritos':'Añadir a favoritos'} onClick={e=>{e.stopPropagation();toggleFavorite(p.title)}}><Heart fill={favorites.has(p.title)?'currentColor':'none'}/></button><span>{p.category}</span></div><div className="plan-body"><h3 role="button" tabIndex={0} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onPlan(p)}}}>{p.title}</h3><p>{p.time}</p><p>{locationAllowed?`${p.distance} · `:''}{p.spots}</p><div className="avatars"><img loading="lazy" decoding="async" src="./assets/images/photo-1492562080023-ab3db95bfbce.jpg" alt="Participante"/><img loading="lazy" decoding="async" src="./assets/images/photo-1494790108377-be9c29b29330.jpg" alt="Participante"/><img loading="lazy" decoding="async" src="./assets/images/photo-1500648767791-00dcc994a43e.jpg" alt="Participante"/><span>+3</span></div></div></article>)}</div>
}

export function PlanDetail({plan,onClose,onOpenChat}:{plan:Plan,onClose:()=>void,onOpenChat?:(name:string)=>void}){
  const organizer='Javi';
  const {favorites,toggleFavorite}=usePlanFavorites();
  const favorite=favorites.has(plan.title);
  const [following,setFollowing]=useState(()=>loadStored<string[]>(storageKeys.organizerFollows,[]).includes(organizer));
  const [joined,setJoined]=useState(()=>loadStored<string[]>(storageKeys.joinedPlans,[]).includes(plan.title));
  const [showParticipants,setShowParticipants]=useState(false);
  const [locationAllowed]=useState(()=>canUseLocation(loadPrivacySettings()));
  const [blocked]=useState<Set<string>>(()=>blockedNames());
  const participants=['Marta','Carlos','Laura','Sara','Álex','Nuria'].filter(name=>!blocked.has(name));

  useEffect(()=>{
    const onKeyDown=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};
    document.addEventListener('keydown',onKeyDown);
    return ()=>document.removeEventListener('keydown',onKeyDown);
  },[onClose]);
  useEffect(()=>{
    const current=new Set(loadStored<string[]>(storageKeys.joinedPlans,[]));
    if(joined)current.add(plan.title);else current.delete(plan.title);
    saveStored(storageKeys.joinedPlans,[...current]);
  },[joined,plan.title]);
  useEffect(()=>{
    const current=new Set(loadStored<string[]>(storageKeys.organizerFollows,[]));
    if(following)current.add(organizer);else current.delete(organizer);
    saveStored(storageKeys.organizerFollows,[...current]);
  },[following]);

  return <div className="detail-overlay" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><article className="detail-card" role="dialog" aria-modal="true" aria-label={`Detalle de ${plan.title}`}><div className="detail-photo"><img decoding="async" src={plan.image} alt={plan.title}/><button type="button" className="back" aria-label="Cerrar detalle" onClick={onClose}><ChevronLeft/></button><button type="button" className={`heart ${favorite?'is-favorite':''}`} aria-label={favorite?'Quitar de favoritos':'Añadir a favoritos'} onClick={()=>toggleFavorite(plan.title)}><Heart fill={favorite?'currentColor':'none'}/></button><span>1/5</span></div><div className="detail-body"><div className="detail-title"><h1>{plan.title}</h1><span>{plan.category}</span></div><div className="info-row"><CalendarDays/><div><strong>{plan.time}</strong><span>Duración aproximada 2 h</span></div></div><div className="info-row"><MapPin/><div><strong>{plan.place}</strong><span>{locationAllowed?`Tarragona · ${plan.distance}`:'Distancia oculta por tu privacidad'}</span></div><ChevronRight/></div><div className="info-row"><UsersRound/><div><strong>{plan.spots}</strong><span>Grupo abierto y buen ambiente</span></div></div><div className="participant-row"><div className="avatars big"><img loading="lazy" decoding="async" src="./assets/images/photo-1492562080023-ab3db95bfbce.jpg" alt="Participante"/><img loading="lazy" decoding="async" src="./assets/images/photo-1494790108377-be9c29b29330.jpg" alt="Participante"/><img loading="lazy" decoding="async" src="./assets/images/photo-1500648767791-00dcc994a43e.jpg" alt="Participante"/></div><button type="button" onClick={()=>setShowParticipants(v=>!v)}>{showParticipants?'Ocultar':'Ver todos'} <ChevronRight/></button></div>{showParticipants&&<div className="participant-list">{participants.map(name=><span key={name}>{name}</span>)}</div>}<p className="description">Plan seleccionado para conocer gente, pasarlo bien y disfrutar de una experiencia real en grupo.</p><div className="chips"><span>{plan.category}</span><span>Social</span><span>Buen ambiente</span><span>+2</span></div><div className="organizer"><img loading="lazy" decoding="async" src="./assets/images/photo-1494790108377-be9c29b29330.jpg" alt="Javi, organizador"/><div><small>Organiza</small><strong>{organizer}</strong><span>Valoración 4.8 ⭐</span></div><button type="button" className={following?'is-following':''} aria-pressed={following} onClick={()=>setFollowing(v=>!v)}>{following?'Siguiendo':'Seguir'}</button></div><PlanFeatureTools plan={plan} onOpenChat={onOpenChat}/><button type="button" className={`join ${joined?'is-joined':''}`} onClick={()=>setJoined(v=>!v)}>{joined?<Check/>:<UsersRound/>}{joined?'Ya estás dentro':'Unirme al plan'}</button></div></article></div>
}
