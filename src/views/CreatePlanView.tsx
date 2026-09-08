import { useState } from 'react';
import { CalendarDays, MapPin, UsersRound } from 'lucide-react';
import { categories } from '../data/demoData';
import { planAudience } from '../lib/privacy';
import { createPlanFromDraft } from '../lib/planLogic';
import type { Plan, View } from '../types';

export function CreatePlanView({setView,onCreate}:{setView:(v:View)=>void,onCreate:(plan:Plan)=>void}){
  const [title,setTitle]=useState('');
  const [place,setPlace]=useState('');
  const [when,setWhen]=useState('');
  const [spots,setSpots]=useState('6');
  const [category,setCategory]=useState('Deporte');
  const [created,setCreated]=useState(false);

  const submit=(e:React.FormEvent)=>{
    e.preventDefault();
    const categoryImage=categories.find(([name])=>name===category)?.[1]||categories[0][1];
    const basePlan=createPlanFromDraft({title,place,when,spots,category,image:categoryImage});
    if(!basePlan)return;
    const plan:Plan={...basePlan,visibility:planAudience()};
    onCreate(plan);
    setCreated(true);
  };

  return <div className="page create-plan-page"><div className="page-title"><div><h1>Crear plan</h1><p>Publica una propuesta para conocer gente y hacer algo juntos</p></div></div>{created?<div className="create-success"><strong>Plan creado correctamente</strong><span>Se ha añadido a Explora respetando tu preferencia de privacidad.</span><button onClick={()=>setView('Explora')}>Ver planes</button></div>:<form className="create-plan-card" onSubmit={submit}><label>Nombre del plan<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ej. Pádel al atardecer" required/></label><label><MapPin/> Lugar<input value={place} onChange={e=>setPlace(e.target.value)} placeholder="Tarragona, Salou..." required/></label><label><CalendarDays/> Fecha y hora<input value={when} onChange={e=>setWhen(e.target.value)} placeholder="Hoy · 19:00" required/></label><label>Categoría<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(([name])=><option key={name} value={name}>{name}</option>)}</select></label><label><UsersRound/> Plazas<input type="number" min="2" max="50" value={spots} onChange={e=>setSpots(e.target.value)}/></label><button type="submit">Crear plan</button></form>}</div>
}
