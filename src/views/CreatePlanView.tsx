import { useState } from 'react';
import { CalendarDays, MapPin, UsersRound } from 'lucide-react';
import type { View } from '../types';

export function CreatePlanView({setView}:{setView:(v:View)=>void}){
  const [title,setTitle]=useState('');
  const [place,setPlace]=useState('');
  const [when,setWhen]=useState('');
  const [spots,setSpots]=useState('6');
  const [created,setCreated]=useState(false);
  const submit=(e:React.FormEvent)=>{e.preventDefault();if(!title.trim()||!place.trim()||!when.trim())return;setCreated(true)};

  return <div className="page create-plan-page"><div className="page-title"><div><h1>Crear plan</h1><p>Publica una propuesta para conocer gente y hacer algo juntos</p></div></div>{created?<div className="create-success"><strong>Plan creado correctamente</strong><span>Ya tienes el prototipo del flujo de creación funcionando.</span><button onClick={()=>setView('Explora')}>Ver planes</button></div>:<form className="create-plan-card" onSubmit={submit}><label>Nombre del plan<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ej. Pádel al atardecer"/></label><label><MapPin/> Lugar<input value={place} onChange={e=>setPlace(e.target.value)} placeholder="Tarragona, Salou..."/></label><label><CalendarDays/> Fecha y hora<input value={when} onChange={e=>setWhen(e.target.value)} placeholder="Sábado · 19:00"/></label><label><UsersRound/> Plazas<input type="number" min="2" max="50" value={spots} onChange={e=>setSpots(e.target.value)}/></label><button type="submit">Crear plan</button></form>}</div>
}
