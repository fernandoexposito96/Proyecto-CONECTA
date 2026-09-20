import { useEffect, useMemo, useState } from 'react';
import { Flame, MapPin, Plus, UserPlus, Zap } from 'lucide-react';
import type { ChatContact } from '../components/explore/PersonDetailCard';
import { discoverPeople, type PersonSearchResult } from '../lib/communityBackend';
import { requestBackendConnection } from '../lib/socialBackend';
import type { ExploreFilter, Plan } from '../types';
const img=(name:string)=>`./assets/images/${name}`;
const demoPeople=[
 {name:'Laura',age:26,distance:'3 km',photo:img('photo-1494790108377-be9c29b29330.jpg'),tags:['Running','Viajes']},
 {name:'Marc',age:28,distance:'5 km',photo:img('photo-1500648767791-00dcc994a43e.jpg'),tags:['Senderismo','Fotografía']},
 {name:'Sofía',age:24,distance:'2 km',photo:img('photo-1534528741775-53994a69daeb.jpg'),tags:['Gimnasio','Gastronomía']},
 {name:'Carlos',age:30,distance:'4 km',photo:img('photo-1507003211169-0a1dd7228f2d.jpg'),tags:['Deporte','Viajes']},
];
const stories=[
 {name:'Laura',time:'hace 2 h',title:'Atardecer increíble 🌅',photo:img('photo-1507525428034-b723cf961d3e.jpg'),cta:'Ver plan · 3 plazas'},
 {name:'Marc',time:'hace 4 h',title:'Ruta de hoy ⛰️',photo:img('photo-1551632811-561732d1e306.jpg'),cta:'Ver plan · 5 plazas'},
 {name:'Sofía',time:'hace 6 h',title:'Noche épica ✨',photo:img('photo-1492684223066-81342ee5ff30.jpg'),cta:'Ver plan · 12 plazas'},
 {name:'Carlos',time:'hace 8 h',title:'Tapas en buena compañía 🍴',photo:img('photo-1500530855697-b586d89ba3ee.jpg'),cta:'Ver plan · 4 plazas'},
];
const fallbackAvatar=img('photo-1529156069898-49953e39b3ac.jpg');
type ExplorePerson={id?:string;name:string;age?:number;distance:string;photo:string;tags:string[];city?:string};
const normalize=(value:string)=>value.trim().toLocaleLowerCase('es');
const dayStart=(date:Date)=>new Date(date.getFullYear(),date.getMonth(),date.getDate());
function planMatchesFilter(plan:Plan,filter:ExploreFilter){
 if(filter==='all'||filter==='near')return true;if(!plan.startsAt)return false;
 const start=new Date(plan.startsAt);if(Number.isNaN(start.getTime()))return false;
 const now=new Date();const sameDay=start.toDateString()===now.toDateString();const hour=start.getHours();
 if(filter==='today')return sameDay;if(filter==='afternoon')return sameDay&&hour>=12&&hour<19;if(filter==='tonight')return sameDay&&hour>=19;
 const days=Math.floor((dayStart(start).getTime()-dayStart(now).getTime())/86400000);
 if(filter==='week')return days>=0&&days<=7;if(filter==='weekend'){const day=start.getDay();return days>=0&&days<=7&&(day===0||day===6)}return true;
}
export function ExploreView({onPlan,extraPlans=[],initialFilter='all',initialCategory=null,onChat}:{onPlan:(plan:Plan)=>void;extraPlans?:Plan[];initialFilter?:ExploreFilter;initialCategory?:string|null;onChat:(contact:ChatContact)=>void;}){
 const [realPeople,setRealPeople]=useState<PersonSearchResult[]>([]);const [loading,setLoading]=useState(true);const [connected,setConnected]=useState<Set<string>>(()=>new Set());
 useEffect(()=>{let active=true;void discoverPeople().then(items=>{if(active)setRealPeople(items)}).catch(error=>console.warn('CONECTA Explore real profiles unavailable; demo preserved',error)).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
 const people=useMemo<ExplorePerson[]>(()=>{const names=new Set(demoPeople.map(p=>normalize(p.name)));const remote=realPeople.filter(p=>!names.has(normalize(p.name))).map(p=>({id:p.id,name:p.name,distance:p.city||'Cerca de ti',photo:p.avatar||fallbackAvatar,tags:[p.username?`@${p.username}`:'CONECTA',p.city||'Comunidad'].filter(Boolean),city:p.city}));return [...demoPeople,...remote]},[realPeople]);
 const plans=useMemo(()=>extraPlans.filter(plan=>!initialCategory||normalize(plan.category)===normalize(initialCategory)).filter(plan=>planMatchesFilter(plan,initialFilter)).slice(0,8),[extraPlans,initialCategory,initialFilter]);
 const addPerson=async(person:ExplorePerson)=>{if(!person.id||connected.has(person.id))return;try{if(await requestBackendConnection(person.id))setConnected(prev=>new Set(prev).add(person.id!))}catch(error){console.warn('CONECTA Explore connection request failed',error)}};
 return <main className="page explore-page explore-live" aria-label="Explora">
  <header className="explore-live-hero"><div><b>CONECTA</b><h1>Explora</h1><p>Gente real. Planes de verdad.</p></div><div className="explore-place"><strong>Tarragona</strong><span>Siempre es un buen plan ♡</span></div></header>
  <section className="now-card"><Flame/><div><strong>Qué está pasando ahora</strong><span>{people.length} personas activas · {Math.max(plans.length,6)} planes hoy</span><small>Descubre qué empieza cerca de ti</small></div><b>›</b></section>
  <nav className="explore-chips" aria-label="Categorías"><button className="active">▦ Todo</button><button>🏃 Deporte</button><button>🗓 Planes</button><button>✈️ Viajes</button><button>🍴 Gastronomía</button><button>🏛 Cultura</button></nav>
  <section className="explore-live-section"><div className="explore-live-title"><h2>Estados <small>● {people.length} conectados ahora</small></h2><span>Ver todos →</span></div><div className="live-statuses"><button className="live-status add"><i><Plus/></i><b>Tu estado</b></button>{people.slice(0,8).map((p,i)=><button className="live-status" key={p.id||p.name} onClick={()=>p.id&&onChat({name:p.name,userId:p.id})}><i><img src={p.photo} alt=""/>{i<2&&<em/>}</i><b>{p.name}</b>{i===3&&<small><Zap/> Ahora</small>}</button>)}</div></section>
  <section className="explore-live-section"><div className="explore-live-title"><h2>Historias de la comunidad</h2><span>Ver todas →</span></div><div className="live-stories">{stories.map((s,i)=><article className="live-story" key={s.name}><img src={s.photo} alt=""/><div className="story-person"><img src={demoPeople[i].photo} alt=""/><span><b>{s.name}</b><small>{s.time}</small></span></div><strong>{s.title}</strong><button>{s.cta}</button></article>)}</div></section>
  <section className="explore-live-section"><div className="explore-live-title"><h2>Coincidencias de hoy ✨</h2><span>Ver más →</span></div>{loading&&<p className="muted">Buscando personas de CONECTA…</p>}<div className="match-grid">{people.map((p,i)=><article className="match-card" key={p.id||`demo-${p.name}`}><div className="match-photo"><img src={p.photo} alt=""/><span>♥ {Math.max(82,92-i*3)}% afinidad</span></div><div className="match-body"><h3>{p.name}{p.age?`, ${p.age}`:''}</h3><small><MapPin/> {p.distance}</small><div>{p.tags.map(t=><span key={t}>{t}</span>)}</div><p>{i===0?'Os gusta running + disponibles esta tarde':i===1?'Tenéis intereses en común':'Disponible para planes esta semana'}</p><button onClick={()=>void addPerson(p)} disabled={!p.id||connected.has(p.id)}><UserPlus/> {p.id&&connected.has(p.id)?'Solicitud enviada':'Conectar'}</button></div></article>)}</div></section>
  {plans.length>0&&<section className="explore-live-section"><div className="explore-live-title"><h2>Planes que están despegando 🚀</h2><span>Ver todos →</span></div><div className="trending-plans">{plans.map(plan=><button key={plan.backendId||`${plan.title}-${plan.time}`} onClick={()=>onPlan(plan)}><img src={plan.image||fallbackAvatar} alt=""/><span><strong>{plan.title}</strong><small><MapPin/> {plan.distance} · {plan.time}</small><em>{plan.category}</em></span></button>)}</div></section>}
 </main>;
}