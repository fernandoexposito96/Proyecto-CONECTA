import { useEffect, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Heart, MapPin, UsersRound } from 'lucide-react';
import { blockedNames, canUseLocation, loadPrivacySettings } from '../lib/privacy';
import { planIdentityKey } from '../lib/planLogic';
import { joinPlan, leavePlan, isPlanJoined } from '../lib/attendanceBackend';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import type { Plan } from '../types';
import { PlanFeatureTools } from './PlanFeatureTools';

export function PlanCards({items,onPlan}:{items:Plan[],onPlan:(p:Plan)=>void}){
  const [favorites,setFavorites]=useState<Set<string>>(()=>new Set(loadStored<string[]>(storageKeys.planFavorites,[])));
  const [locationAllowed]=useState(()=>canUseLocation(loadPrivacySettings()));
  useEffect(()=>{saveStored(storageKeys.planFavorites,[...favorites])},[favorites]);
  const toggleFavorite=(key:string)=>setFavorites(prev=>{const next=new Set(prev);next.has(key)?next.delete(key):next.add(key);return next});
  return <div className="plan-grid">{items.map((p)=>{const key=planIdentityKey(p);return <article className="plan-card" key={key} role="button" tabIndex={0} onClick={()=>onPlan(p)} onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();onPlan(p)}}}><div className="plan-image"><img loading="lazy" decoding="async" src={p.image} alt={p.title}/><button type="button" className={favorites.has(key)?'is-favorite':''} aria-label={favorites.has(key)?'Quitar de favoritos':'Añadir a favoritos'} onClick={e=>{e.stopPropagation();toggleFavorite(key)}}><Heart fill={favorites.has(key)?'currentColor':'none'}/></button><span>{p.category}</span></div><div className="plan-body"><h3>{p.title}</h3><p>{p.time}</p><p>{locationAllowed?`${p.distance} · `:''}{p.spots}</p><div className="avatars"><img loading="lazy" decoding="async" src="./assets/images/photo-1492562080023-ab3db95bfbce.jpg" alt="Participante"/><img loading="lazy" decoding="async" src="./assets/images/photo-1494790108377-be9c29b29330.jpg" alt="Participante"/><img loading="lazy" decoding="async" src="./assets/images/photo-1500648767791-00dcc994a43e.jpg" alt="Participante"/><span>+3</span></div></div></article>})}</div>
}

export function PlanDetail({plan,onClose,onOpenChat}:{plan:Plan,onClose:()=>void,onOpenChat?:(name:string)=>void}){
  const organizer='Javi';
  const identityKey=planIdentityKey(plan);
  const [favorite,setFavorite]=useState(()=>loadStored<string[]>(storageKeys.planFavorites,[]).includes(identityKey));
  const [following,setFollowing]=useState(()=>loadStored<string[]>(storageKeys.organizerFollows,[]).includes(organizer));
  const [joined,setJoined]=useState(()=>loadStored<string[]>(storageKeys.joinedPlans,[]).includes(identityKey));
  const [joinBusy,setJoinBusy]=useState(false);
  const [joinError,setJoinError]=useState('');
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
    const current=new Set(loadStored<string[]>(storageKeys.planFavorites,[]));
    favorite?current.add(identityKey):current.delete(identityKey);
    saveStored(storageKeys.planFavorites,[...current]);
  },[favorite,identityKey]);

  useEffect(()=>{
    const current=new Set(loadStored<string[]>(storageKeys.organizerFollows,[]));
    following?current.add(organizer):current.delete(organizer);
    saveStored(storageKeys.organizerFollows,[...current]);
  },[following]);

  // Si el plan tiene backendId, comprobamos el estado real en Supabase al abrir el detalle.
  useEffect(()=>{
    if(!plan.backendId)return;
    let active=true;
    void isPlanJoined(plan.backendId)
      .then(value=>{if(active)setJoined(value)})
      .catch(error=>console.warn('CONECTA: no se pudo comprobar la asistencia real',error));
    return ()=>{active=false};
  },[plan.backendId]);

  const toggleJoin=async()=>{
    if(joinBusy)return;
    setJoinError('');
    if(!plan.backendId){
      // Plan sin id real (todavía en modo demo/local): mantenemos el comportamiento anterior.
      const next=!joined;
      setJoined(next);
      const current=new Set(loadStored<string[]>(storageKeys.joinedPlans,[]));
      next?current.add(identityKey):current.delete(identityKey);
      saveStored(storageKeys.joinedPlans,[...current]);
      return;
    }
    setJoinBusy(true);
    const next=!joined;
    try{
      if(next){
        await joinPlan(plan.backendId);
      }else{
        await leavePlan(plan.backendId);
      }
      setJoined(next);
    }catch(error){
      setJoinError(error instanceof Error?error.message:'No se ha podido actualizar tu asistencia.');
    }finally{
      setJoinBusy(false);
    }
  };

  return <div className="detail-overlay" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><article className="detail-card" role="dialog" aria-modal="true" aria-label={`Detalle de ${plan.title}`}><div className="detail-photo"><img decoding="async" src={plan.image} alt={plan.title}/><button type="button" className="back" aria-label="Cerrar detalle" onClick={onClose}><ChevronLeft/></button><button type="button" className={`heart ${favorite?'is-favorite':''}`} aria-label={favorite?'Quitar de favoritos':'Añadir a favoritos'} onClick={()=>setFavorite(v=>!v)}><Heart fill={favorite?'currentColor':'none'}/></button><span>1/5</span></div><div className="detail-body"><div className="detail-title"><h1>{plan.title}</h1><span>{plan.category}</span></div><div className="info-row"><CalendarDays/><div><strong>{plan.time}</strong><span>Duración aproximada 2 h</span></div></div><div className="info-row"><MapPin/><div><strong>{plan.place}</strong><span>{locationAllowed?`Tarragona · ${plan.distance}`:'Distancia oculta por tu privacidad'}</span></div><ChevronRight/></div><div className="info-row"><UsersRound/><div><strong>{plan.spots}</strong><span>Grupo abierto y buen ambiente</span></div></div><div className="participant-row"><div className="avatars big"><img loading="lazy" decoding="async" src="./assets/images/photo-1492562080023-ab3db95bfbce.jpg" alt="Participante"/><img loading="lazy" decoding="async" src="./assets/images/photo-1494790108377-be9c29b29330.jpg" alt="Participante"/><img loading="lazy" decoding="async" src="./assets/images/photo-1500648767791-00dcc994a43e.jpg" alt="Participante"/></div><button type="button" onClick={()=>setShowParticipants(v=>!v)}>{showParticipants?'Ocultar':'Ver todos'} <ChevronRight/></button></div>{showParticipants&&<div className="participant-list">{participants.map(name=><span key={name}>{name}</span>)}</div>}<p className="description">Plan seleccionado para conocer gente, pasarlo bien y disfrutar de una experiencia real en grupo.</p><div className="chips"><span>{plan.category}</span><span>Social</span><span>Buen ambiente</span><span>+2</span></div><div className="organizer"><img loading="lazy" decoding="async" src="./assets/images/photo-1494790108377-be9c29b29330.jpg" alt="Javi, organizador"/><div><small>Organiza</small><strong>{organizer}</strong><span>Valoración 4.8 ⭐</span></div><button type="button" className={following?'is-following':''} aria-pressed={following} onClick={()=>setFollowing(v=>!v)}>{following?'Siguiendo':'Seguir'}</button></div><PlanFeatureTools plan={plan} onOpenChat={onOpenChat}/><button type="button" className={`join ${joined?'is-joined':''}`} disabled={joinBusy} onClick={()=>{void toggleJoin()}}>{joined?<Check/>:<UsersRound/>}{joinBusy?'Actualizando…':joined?'Ya estás dentro':'Unirme al plan'}</button>{joinError&&<p className="plan-tool-error" role="status">{joinError}</p>}</div></article></div>
}
