import { useState } from 'react';
import { CalendarDays, Camera, Car, ChevronLeft, Clock3, MapPin, PackageCheck, Sparkles, UsersRound } from 'lucide-react';
import { categories } from '../data/demoData';
import { planAudience } from '../lib/privacy';
import { createPlanFromDraft } from '../lib/planLogic';
import type { Plan, View } from '../types';

const wanted=['Deporte','Comida','Café','Cine','Música','Viajes'] as const;

export function CreatePlanView({setView,onCreate}:{setView:(v:View)=>void,onCreate:(plan:Plan)=>Promise<boolean>}){
  const [title,setTitle]=useState(''); const [place,setPlace]=useState(''); const [when,setWhen]=useState('');
  const [spots,setSpots]=useState('6'); const [category,setCategory]=useState('Deporte'); const [level,setLevel]=useState('Todos');
  const [cost,setCost]=useState(''); const [privacy,setPrivacy]=useState('Público'); const [description,setDescription]=useState('');
  const [created,setCreated]=useState(false); const [synced,setSynced]=useState(false); const [creating,setCreating]=useState(false); const [draftNotice,setDraftNotice]=useState(false);
  const dateValue=when.includes('T')?when.split('T')[0]:''; const timeValue=when.includes('T')?when.split('T')[1]:'';
  const setDate=(date:string)=>setWhen(date?`${date}T${timeValue||'18:00'}`:'');
  const setTime=(time:string)=>setWhen(time?`${dateValue||new Date().toISOString().slice(0,10)}T${time}`:dateValue?`${dateValue}T18:00`:'');
  const imageFor=(name:string)=>categories.find(([n])=>n===name)?.[1]||categories[0][1];
  const submit=async(e:React.FormEvent)=>{e.preventDefault();if(creating)return;const basePlan=createPlanFromDraft({title,place,when,spots,category,image:imageFor(category)});if(!basePlan)return;const plan:Plan={...basePlan,visibility:planAudience()};setCreating(true);try{const published=await onCreate(plan);setSynced(published);setCreated(true)}finally{setCreating(false)}};
  if(created)return <div className="page create-plan-page"><div className="create-success"><Sparkles/><strong>{synced?'Plan creado y sincronizado':'Plan guardado en este dispositivo'}</strong><span>{synced?'Ya aparece en el listado de planes y está sincronizado con tu cuenta.':'Tu copia local se conserva hasta recuperar la conexión.'}</span><button type="button" onClick={()=>setView('Explora')}>Ver planes</button></div></div>;
  return <div className="page create-plan-page create-plan-final">
    <header className="cp-head"><button className="cp-back" type="button" onClick={()=>setView('Inicio')} aria-label="Volver"><ChevronLeft/></button><div><h1>Crear plan</h1><p>Haz realidad buenos planes</p></div><button type="button" className="cp-draft" onClick={()=>{setDraftNotice(true);setTimeout(()=>setDraftNotice(false),1800)}}>▣ <b>Borrador</b></button></header>
    {draftNotice&&<div className="draft-notice">Tu borrador se mantiene mientras creas el plan.</div>}
    <div className="cp-categories">{wanted.map(name=><button type="button" key={name} className={category===name?'active':''} onClick={()=>setCategory(name)}><img src={imageFor(name)} alt=""/><b>{name}</b></button>)}<button type="button" className={!wanted.includes(category as typeof wanted[number])?'active':''}><span className="cp-more">•••</span><b>Más</b></button></div>
    <form className="cp-form" onSubmit={e=>void submit(e)}>
      <label className="cp-card cp-wide"><span className="cp-icon"><Sparkles/></span><span className="cp-body"><b>Nombre del plan</b><span className="cp-inline"><input value={title} maxLength={60} onChange={e=>setTitle(e.target.value)} placeholder="Ej. Pádel al atardecer" required/><button type="button" onClick={()=>{if(!title)setTitle(category==='Deporte'?'Pádel al atardecer':`${category} con buena gente`)}}>🎲<small>Sugerir</small></button></span><small className="cp-count">{title.length}/60</small></span></label>
      <label className="cp-card cp-wide"><span className="cp-icon"><MapPin/></span><span className="cp-body"><b>Lugar</b><span className="cp-inline"><input value={place} onChange={e=>setPlace(e.target.value)} placeholder="Tarragona, Salou..." required/><button type="button" onClick={()=>setPlace('Mi ubicación')}>◎</button></span><span className="cp-map"><i>●</i><button type="button" onClick={()=>setPlace('Mi ubicación')}>➤ Usar mi ubicación actual ›</button></span></span></label>
      <div className="cp-grid"><label className="cp-card"><span className="cp-icon"><CalendarDays/></span><span className="cp-body"><b>Fecha</b><input type="date" value={dateValue} onChange={e=>setDate(e.target.value)} required/></span></label><label className="cp-card"><span className="cp-icon"><Clock3/></span><span className="cp-body"><b>Hora</b><input type="time" value={timeValue} onChange={e=>setTime(e.target.value)} required/></span></label></div>
      <div className="cp-grid"><label className="cp-card"><span className="cp-icon"><UsersRound/></span><span className="cp-body"><b>Plazas</b><span className="cp-step"><button type="button" onClick={()=>setSpots(String(Math.max(2,Number(spots)-1)))}>−</button><input type="number" min="2" max="50" value={spots} onChange={e=>setSpots(e.target.value)} required/><button type="button" onClick={()=>setSpots(String(Math.min(50,Number(spots)+1)))}>＋</button></span></span></label><label className="cp-card"><span className="cp-icon">▥</span><span className="cp-body"><b>Nivel</b><select value={level} onChange={e=>setLevel(e.target.value)}><option>Todos</option><option>Principiante</option><option>Intermedio</option><option>Avanzado</option></select></span></label></div>
      <div className="cp-grid"><label className="cp-card"><span className="cp-icon">◇</span><span className="cp-body"><b>Coste</b><input value={cost} onChange={e=>setCost(e.target.value)} placeholder="Opcional €"/></span></label><label className="cp-card"><span className="cp-icon">♙</span><span className="cp-body"><b>Privacidad</b><select value={privacy} onChange={e=>setPrivacy(e.target.value)}><option>Público</option><option>Solo invitados</option></select></span></label></div>
      <label className="cp-description"><b>Descripción</b><textarea maxLength={300} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Cuenta más detalles sobre el plan..."/><small>{description.length}/300</small></label>
      <div className="cp-extras"><button type="button"><Camera/><span><b>Añadir fotos</b><small>0/10</small></span><i>›</i></button><button type="button"><PackageCheck/><span><b>Material necesario</b><small>Opcional</small></span><i>›</i></button><button type="button"><Car/><span><b>Transporte</b><small>Opcional</small></span><i>›</i></button></div>
      <button className="cp-submit" type="submit" disabled={creating}><Sparkles/><b>{creating?'Publicando…':'Crear plan'}</b><span>→</span></button><p className="cp-footer">Un buen plan puede cambiar tu día 💜</p>
    </form>
  </div>
}
