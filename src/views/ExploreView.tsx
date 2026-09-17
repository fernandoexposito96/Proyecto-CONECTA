import { useEffect, useMemo, useState } from 'react';
import { Plus, UserPlus, MapPin } from 'lucide-react';
import type { ChatContact } from '../components/explore/PersonDetailCard';
import { discoverPeople, type PersonSearchResult } from '../lib/communityBackend';
import { requestBackendConnection } from '../lib/socialBackend';
import type { ExploreFilter, Plan } from '../types';
const img=(name:string)=>`./assets/images/${name}`;
const demoPeople=[
 {name:'Laura',age:26,distance:'3 km',photo:img('photo-1494790108377-be9c29b29330.jpg'),tags:['Viajes','Gastronomía','Naturaleza']},
 {name:'Marc',age:28,distance:'5 km',photo:img('photo-1500648767791-00dcc994a43e.jpg'),tags:['Deporte','Música','Amigos']},
 {name:'Sofía',age:24,distance:'2 km',photo:img('photo-1534528741775-53994a69daeb.jpg'),tags:['Arte','Fotografía','Conciertos']},
 {name:'Carlos',age:30,distance:'4 km',photo:img('photo-1507003211169-0a1dd7228f2d.jpg'),tags:['Deporte','Viajes','Cine']},
];
const stories=[
 {name:'Laura',time:'hace 2 h',title:'Atardecer increíble 🌅',photo:img('photo-1507525428034-b723cf961d3e.jpg')},
 {name:'Marc',time:'hace 4 h',title:'Ruta de hoy ⛰️',photo:img('photo-1551632811-561732d1e306.jpg')},
 {name:'Sofía',time:'hace 6 h',title:'Noche de amigos ✨',photo:img('photo-1492684223066-81342ee5ff30.jpg')},
 {name:'Carlos',time:'hace 8 h',title:'Día perfecto 🌴',photo:img('photo-1500530855697-b586d89ba3ee.jpg')},
];
const fallbackAvatar=img('photo-1529156069898-49953e39b3ac.jpg');
type ExplorePerson={id?:string;name:string;age?:number;distance:string;photo:string;tags:string[];city?:string};
const normalize=(value:string)=>value.trim().toLocaleLowerCase('es');
const dayStart=(date:Date)=>new Date(date.getFullYear(),date.getMonth(),date.getDate());
function planMatchesFilter(plan:Plan,filter:ExploreFilter){
 if(filter==='all'||filter==='near')return true;
 if(!plan.startsAt)return false;
 const start=new Date(plan.startsAt);if(Number.isNaN(start.getTime()))return false;
 const now=new Date();const sameDay=start.toDateString()===now.toDateString();const hour=start.getHours();
 if(filter==='today')return sameDay;
 if(filter==='afternoon')return sameDay&&hour>=12&&hour<19;
 if(filter==='tonight')return sameDay&&hour>=19;
 const today=dayStart(now);const target=dayStart(start);const days=Math.floor((target.getTime()-today.getTime())/86400000);
 if(filter==='week')return days>=0&&days<=7;
 if(filter==='weekend'){const day=start.getDay();return days>=0&&days<=7&&(day===0||day===6)}
 return true;
}
export function ExploreView({onPlan,extraPlans=[],initialFilter='all',initialCategory=null,onChat}:{onPlan:(plan:Plan)=>void;extraPlans?:Plan[];initialFilter?:ExploreFilter;initialCategory?:string|null;onChat:(contact:ChatContact)=>void;}){
 const [realPeople,setRealPeople]=useState<PersonSearchResult[]>([]);const [loading,setLoading]=useState(true);const [connected,setConnected]=useState<Set<string>>(()=>new Set());
 useEffect(()=>{let active=true;void discoverPeople().then(items=>{if(active)setRealPeople(items)}).catch(error=>console.warn('CONECTA Explore real profiles unavailable; demo preserved',error)).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
 const people=useMemo<ExplorePerson[]>(()=>{const demoNames=new Set(demoPeople.map(p=>normalize(p.name)));const remote=realPeople.filter(p=>!demoNames.has(normalize(p.name))).map(p=>({id:p.id,name:p.name,distance:p.city||'Cerca de ti',photo:p.avatar||fallbackAvatar,tags:[p.username?`@${p.username}`:'CONECTA',p.city||'Comunidad'].filter(Boolean),city:p.city}));return [...demoPeople,...remote]},[realPeople]);
 const plans=useMemo(()=>extraPlans.filter(plan=>!initialCategory||normalize(plan.category)===normalize(initialCategory)).filter(plan=>planMatchesFilter(plan,initialFilter)).slice(0,6),[extraPlans,initialCategory,initialFilter]);
 const addPerson=async(person:ExplorePerson)=>{const userId=person.id;if(!userId||connected.has(userId))return;try{const ok=await requestBackendConnection(userId);if(ok)setConnected(prev=>new Set(prev).add(userId))}catch(error){console.warn('CONECTA Explore connection request failed',error)}};
 return <main className="page explore-page explore-social-v2" aria-label="Explora">
  <header className="explore-v2-head"><span>CONECTA</span><h1>Explora</h1><p>Descubre lo que está pasando en la comunidad</p></header>
  <section className="explore-v2-section"><div className="explore-v2-title"><h2>Estados</h2><span aria-hidden="true">Ver todos →</span></div><div className="explore-v2-statuses"><button className="explore-v2-status add"><i><Plus/></i><b>Tu estado</b></button>{people.slice(0,8).map(p=><button className="explore-v2-status" key={p.id||p.name} onClick={()=>{const userId=p.id;if(userId)onChat({name:p.name,userId})}}><i><img src={p.photo} alt=""/></i><b>{p.name}</b></button>)}</div></section>
  <section className="explore-v2-section"><div className="explore-v2-title"><h2>Historias</h2><span aria-hidden="true">Ver todas →</span></div><div className="explore-v2-stories">{stories.map((s,i)=><article className="explore-v2-story" key={s.name}><img src={s.photo} alt=""/><div className="explore-v2-story-top"><img src={demoPeople[i].photo} alt=""/><span><b>{s.name}</b><small>{s.time}</small></span></div><strong>{s.title}</strong></article>)}</div></section>
  <section className="explore-v2-section"><div className="explore-v2-title"><h2>Personas para agregar</h2><span aria-hidden="true">Ver más →</span></div>{loading&&<p className="muted">Buscando personas de CONECTA…</p>}<div className="explore-v2-people">{people.map(p=><article className="explore-v2-person" key={p.id||`demo-${p.name}`}><div className="explore-v2-person-photo"><img src={p.photo} alt=""/><span><MapPin/> {p.distance}</span></div><div className="explore-v2-person-body"><h3>{p.name}{p.age?`, ${p.age}`:''}</h3><div className="explore-v2-tags">{p.tags.map(t=><span key={t}>{t}</span>)}</div><button onClick={()=>void addPerson(p)} disabled={!p.id||connected.has(p.id)} title={!p.id?'Perfil de demostración':''}><UserPlus/> {p.id&&connected.has(p.id)?'Solicitud enviada':'Agregar'}</button></div></article>)}</div></section>
  {plans.length>0&&<section className="explore-v2-section"><div className="explore-v2-title"><h2>Planes de la comunidad</h2></div><div className="explore-v2-people">{plans.map(plan=><article className="explore-v2-person" key={plan.backendId||`${plan.title}-${plan.time}`}><div className="explore-v2-person-photo"><img src={plan.image||fallbackAvatar} alt=""/><span><MapPin/> {plan.distance}</span></div><div className="explore-v2-person-body"><h3>{plan.title}</h3><div className="explore-v2-tags"><span>{plan.category}</span><span>{plan.time}</span></div><button onClick={()=>onPlan(plan)}>Ver plan</button></div></article>)}</div></section>}
 </main>;
}
