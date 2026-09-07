import { useEffect, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Heart, MapPin, UsersRound } from 'lucide-react';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import type { Plan } from '../types';

export function PlanCards({items,onPlan}:{items:Plan[],onPlan:(p:Plan)=>void}){
  const [favorites,setFavorites]=useState<Set<string>>(()=>new Set(loadStored<string[]>(storageKeys.planFavorites,[])));
  useEffect(()=>{saveStored(storageKeys.planFavorites,[...favorites])},[favorites]);
  const toggleFavorite=(title:string)=>setFavorites(prev=>{const next=new Set(prev);next.has(title)?next.delete(title):next.add(title);return next});
  return <div className="plan-grid">{items.map((p)=><article className="plan-card" key={p.title} onClick={()=>onPlan(p)}><div className="plan-image"><img loading="lazy" decoding="async" src={p.image} alt={p.title}/><button className={favorites.has(p.title)?'is-favorite':''} aria-label={favorites.has(p.title)?'Quitar de favoritos':'Añadir a favoritos'} onClick={e=>{e.stopPropagation();toggleFavorite(p.title)}}><Heart fill={favorites.has(p.title)?'currentColor':'none'}/></button><span>{p.category}</span></div><div className="plan-body"><h3>{p.title}</h3><p>{p.time}</p><p>{p.distance} · {p.spots}</p><div className="avatars"><img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=80&q=80" alt="Participante"/><img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80" alt="Participante"/><img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80" alt="Participante"/><span>+3</span></div></div></article>)}</div>
}

export function PlanDetail({plan,onClose}:{plan:Plan,onClose:()=>void}){
  const [favorite,setFavorite]=useState(()=>loadStored<string[]>(storageKeys.planFavorites,[]).includes(plan.title));
  const [following,setFollowing]=useState(false);
  const [joined,setJoined]=useState(()=>loadStored<string[]>(storageKeys.joinedPlans,[]).includes(plan.title));
  const [showParticipants,setShowParticipants]=useState(false);
  const participants=['Marta','Carlos','Laura','Sara','Álex','Nuria'];

  useEffect(()=>{
    const current=new Set(loadStored<string[]>(storageKeys.planFavorites,[]));
    favorite?current.add(plan.title):current.delete(plan.title);
    saveStored(storageKeys.planFavorites,[...current]);
  },[favorite,plan.title]);
  useEffect(()=>{
    const current=new Set(loadStored<string[]>(storageKeys.joinedPlans,[]));
    joined?current.add(plan.title):current.delete(plan.title);
    saveStored(storageKeys.joinedPlans,[...current]);
  },[joined,plan.title]);

  return <div className="detail-overlay"><article className="detail-card"><div className="detail-photo"><img decoding="async" src={plan.image} alt={plan.title}/><button className="back" aria-label="Cerrar detalle" onClick={onClose}><ChevronLeft/></button><button className={`heart ${favorite?'is-favorite':''}`} aria-label={favorite?'Quitar de favoritos':'Añadir a favoritos'} onClick={()=>setFavorite(v=>!v)}><Heart fill={favorite?'currentColor':'none'}/></button><span>1/5</span></div><div className="detail-body"><div className="detail-title"><h1>{plan.title}</h1><span>{plan.category}</span></div><div className="info-row"><CalendarDays/><div><strong>{plan.time}</strong><span>Duración aproximada 2 h</span></div></div><div className="info-row"><MapPin/><div><strong>{plan.place}</strong><span>Tarragona · {plan.distance}</span></div><ChevronRight/></div><div className="info-row"><UsersRound/><div><strong>{plan.spots}</strong><span>Grupo abierto y buen ambiente</span></div></div><div className="participant-row"><div className="avatars big"><img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=90&q=80" alt="Participante"/><img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=90&q=80" alt="Participante"/><img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=90&q=80" alt="Participante"/></div><button onClick={()=>setShowParticipants(v=>!v)}>{showParticipants?'Ocultar':'Ver todos'} <ChevronRight/></button></div>{showParticipants&&<div className="participant-list">{participants.map(name=><span key={name}>{name}</span>)}</div>}<p className="description">Plan seleccionado para conocer gente, pasarlo bien y disfrutar de una experiencia real en grupo.</p><div className="chips"><span>{plan.category}</span><span>Social</span><span>Buen ambiente</span><span>+2</span></div><div className="organizer"><img loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="Javi, organizador"/><div><small>Organiza</small><strong>Javi</strong><span>Valoración 4.8 ⭐</span></div><button className={following?'is-following':''} onClick={()=>setFollowing(v=>!v)}>{following?'Siguiendo':'Seguir'}</button></div><button className={`join ${joined?'is-joined':''}`} onClick={()=>setJoined(v=>!v)}>{joined?<Check/>:<UsersRound/>}{joined?'Ya estás dentro':'Unirme al plan'}</button></div></article></div>
}
