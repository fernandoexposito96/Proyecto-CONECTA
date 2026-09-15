import { useState } from 'react';
import { CalendarDays, Camera, Car, Clock3, MapPin, PackageCheck, Sparkles, UsersRound } from 'lucide-react';
import { categories } from '../data/demoData';
import { planAudience } from '../lib/privacy';
import { createPlanFromDraft } from '../lib/planLogic';
import type { Plan, View } from '../types';

const categoryIcons:Record<string,string>={Deporte:'🏃',Comida:'🍴',Viajes:'✈️',Cultura:'🎭',Fiesta:'🎵'};

export function CreatePlanView({setView,onCreate}:{setView:(v:View)=>void,onCreate:(plan:Plan)=>Promise<boolean>}){
  const [title,setTitle]=useState('');
  const [place,setPlace]=useState('');
  const [when,setWhen]=useState('');
  const [spots,setSpots]=useState('6');
  const [category,setCategory]=useState('Deporte');
  const [level,setLevel]=useState('Todos');
  const [cost,setCost]=useState('');
  const [privacy,setPrivacy]=useState('Público');
  const [description,setDescription]=useState('');
  const [created,setCreated]=useState(false);
  const [synced,setSynced]=useState(false);
  const [creating,setCreating]=useState(false);
  const [draftNotice,setDraftNotice]=useState(false);
  const dateValue=when.includes('T')?when.split('T')[0]:'';
  const timeValue=when.includes('T')?when.split('T')[1]:'';
  const setDate=(date:string)=>setWhen(date?`${date}T${timeValue||'18:00'}`:'');
  const setTime=(time:string)=>setWhen(time?`${dateValue||new Date().toISOString().slice(0,10)}T${time}`:dateValue?`${dateValue}T18:00`:'');

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(creating)return;
    const categoryImage=categories.find(([name])=>name===category)?.[1]||categories[0][1];
    const basePlan=createPlanFromDraft({title,place,when,spots,category,image:categoryImage});
    if(!basePlan)return;
    const plan:Plan={...basePlan,visibility:planAudience()};
    setCreating(true);
    try{const published=await onCreate(plan);setSynced(published);setCreated(true);}finally{setCreating(false);}
  };

  if(created)return <div className="page create-plan-page"><div className="create-success"><Sparkles/><strong>{synced?'Plan creado y sincronizado':'Plan guardado en este dispositivo'}</strong><span>{synced?'Ya aparece en el listado de planes y está sincronizado con tu cuenta.':'Tu copia local se conserva hasta recuperar la conexión.'}</span><button type="button" onClick={()=>setView('Explora')}>Ver planes</button></div></div>;

  return <div className="page create-plan-page create-plan-premium">
    <header className="create-plan-hero"><div><h1>Crear plan</h1><p>Haz realidad buenos planes</p></div><button type="button" className="draft-button" onClick={()=>{setDraftNotice(true);setTimeout(()=>setDraftNotice(false),1800)}}>▣<span>Borrador</span></button></header>
    {draftNotice&&<div className="draft-notice">Tu borrador se mantiene mientras creas el plan.</div>}
    <div className="create-category-strip">{categories.slice(0,5).map(([name])=><button type="button" key={name} className={category===name?'active':''} onClick={()=>setCategory(name)}><span>{categoryIcons[name]||'•••'}</span>{name}</button>)}<button type="button" className={!categories.slice(0,5).some(([name])=>name===category)?'active':''}><span>•••</span>Otros</button></div>
    <form className="create-plan-card create-plan-card-premium" onSubmit={event=>{void submit(event)}}>
      <label className="create-field create-field-feature"><span className="create-field-icon"><Sparkles/></span><span className="create-field-body"><b>Nombre del plan</b><span className="create-inline"><input value={title} maxLength={60} onChange={e=>setTitle(e.target.value)} placeholder="Ej. Pádel al atardecer" required/><button type="button" onClick={()=>{if(!title)setTitle(category==='Deporte'?'Pádel al atardecer':`${category} con buena gente`)}}>🎲 <small>Sugerir</small></button></span><small className="char-count">{title.length}/60</small></span></label>
      <label className="create-field"><span className="create-field-icon"><MapPin/></span><span className="create-field-body"><b>Lugar</b><span className="create-inline"><input value={place} onChange={e=>setPlace(e.target.value)} placeholder="Tarragona, Salou..." required/><button type="button" onClick={()=>setPlace('Tarragona')}>⌾</button></span><span className="mini-map"><span>●</span><button type="button" onClick={()=>setPlace('Mi ubicación')}>➤ Usar mi ubicación</button></span></span></label>
      <div className="create-two-cols"><label className="create-field compact"><span className="create-field-icon"><CalendarDays/></span><span className="create-field-body"><b>Fecha</b><input type="date" value={dateValue} onChange={e=>setDate(e.target.value)} required/></span></label><label className="create-field compact"><span className="create-field-icon"><Clock3/></span><span className="create-field-body"><b>Hora</b><input type="time" value={timeValue} onChange={e=>setTime(e.target.value)} required/></span></label></div>
      <div className="create-two-cols"><label className="create-field compact"><span className="create-field-icon"><UsersRound/></span><span className="create-field-body"><b>Plazas</b><input type="number" min="2" max="50" value={spots} onChange={e=>setSpots(e.target.value)} required/></span></label><label className="create-field compact"><span className="create-field-icon">▥</span><span className="create-field-body"><b>Nivel</b><select value={level} onChange={e=>setLevel(e.target.value)}><option>Todos</option><option>Principiante</option><option>Intermedio</option><option>Avanzado</option></select></span></label></div>
      <div className="create-two-cols"><label className="create-field compact"><span className="create-field-icon">🏷</span><span className="create-field-body"><b>Coste</b><input value={cost} onChange={e=>setCost(e.target.value)} placeholder="Opcional €"/></span></label><label className="create-field compact"><span className="create-field-icon">🔒</span><span className="create-field-body"><b>Privacidad</b><select value={privacy} onChange={e=>setPrivacy(e.target.value)}><option>Público</option><option>Solo invitados</option></select></span></label></div>
      <label className="create-description"><b>Descripción</b><textarea maxLength={300} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Cuenta más detalles sobre el plan..."/><small>{description.length}/300</small></label>
      <div className="create-extras"><button type="button"><Camera/><b>Añadir fotos</b><small>0/10</small></button><button type="button"><PackageCheck/><b>Material necesario</b><small>Opcional</small></button><button type="button"><Car/><b>Transporte</b><small>Opcional</small></button></div>
      <button className="create-submit" type="submit" disabled={creating}><Sparkles/>{creating?'Publicando…':'Crear plan'}<span>→</span></button><p className="create-plan-footer">Un buen plan puede cambiar tu día 💜</p>
    </form>
  </div>;
}
