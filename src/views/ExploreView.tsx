import { useEffect, useMemo, useState } from 'react';
import { Heart, Image as ImageIcon, MessageCircle, Plus, Search, Sparkles, Users, Zap } from 'lucide-react';
import type { ChatContact } from '../components/explore/PersonDetailCard';
import { discoverPeople, type PersonSearchResult } from '../lib/communityBackend';
import type { ExploreFilter, Plan } from '../types';
const img=(name:string)=>`./assets/images/${name}`;
const demoPeople=[
 {name:'Laura',age:26,distance:'3 km',photo:img('photo-1494790108377-be9c29b29330.jpg'),tags:['Viajes','Café']},
 {name:'Marc',age:28,distance:'5 km',photo:img('photo-1500648767791-00dcc994a43e.jpg'),tags:['Senderismo','Fotografía']},
 {name:'Sofía',age:24,distance:'2 km',photo:img('photo-1534528741775-53994a69daeb.jpg'),tags:['Música','Planes']},
 {name:'Carlos',age:30,distance:'4 km',photo:img('photo-1507003211169-0a1dd7228f2d.jpg'),tags:['Deporte','Viajes']},
];
const stories=[
 {name:'Laura',time:'hace 2 h',title:'Atardecer increíble 🌅',place:'Tarragona',photo:img('photo-1507525428034-b723cf961d3e.jpg'),cta:'Ver plan · 3 plazas'},
 {name:'Marc',time:'hace 4 h',title:'Ruta de hoy ⛰️',place:'La Mussara',photo:img('photo-1551632811-561732d1e306.jpg'),cta:'Ver plan · 5 plazas'},
 {name:'Sofía',time:'hace 6 h',title:'Noche en la playa 🔥',place:'Salou',photo:img('photo-1492684223066-81342ee5ff30.jpg'),cta:'Ver plan · 8 plazas'},
 {name:'Carlos',time:'hace 8 h',title:'Calas secretas 🌊',place:'Cap de Salou',photo:img('photo-1519046904884-53103b34b206.jpg'),cta:'Ver plan · 4 plazas'},
];
const categories=[
 ['Deporte','photo-1534438327276-14e5300c3a48.jpg'],['Gastronomía','photo-1504674900247-0877df9cc836.jpg'],['Ocio','photo-1501386761578-eac5c94b800a.jpg'],['Viajes','photo-1507525428034-b723cf961d3e.jpg'],['Naturaleza','photo-1464822759023-fed622ff2c3b.jpg'],['Cultura','photo-1539037116277-4db20889f2d4.jpg']
] as const;
const fallbackAvatar=img('photo-1529156069898-49953e39b3ac.jpg');
type ExplorePerson={id?:string;name:string;age?:number;distance:string;photo:string;tags:string[];city?:string};
const normalize=(value:string)=>value.trim().toLocaleLowerCase('es');
const dayStart=(date:Date)=>new Date(date.getFullYear(),date.getMonth(),date.getDate());
function planMatchesFilter(plan:Plan,filter:ExploreFilter){if(filter==='all'||filter==='near')return true;if(!plan.startsAt)return false;const start=new Date(plan.startsAt);if(Number.isNaN(start.getTime()))return false;const now=new Date();const sameDay=start.toDateString()===now.toDateString();const hour=start.getHours();if(filter==='today')return sameDay;if(filter==='afternoon')return sameDay&&hour>=12&&hour<19;if(filter==='tonight')return sameDay&&hour>=19;const days=Math.floor((dayStart(start).getTime()-dayStart(now).getTime())/86400000);if(filter==='week')return days>=0&&days<=7;if(filter==='weekend'){const day=start.getDay();return days>=0&&days<=7&&(day===0||day===6)}return true;}
export function ExploreView({onPlan,extraPlans=[],initialFilter='all',initialCategory=null,onChat}:{onPlan:(plan:Plan)=>void;extraPlans?:Plan[];initialFilter?:ExploreFilter;initialCategory?:string|null;onChat:(contact:ChatContact)=>void;}){
 const [realPeople,setRealPeople]=useState<PersonSearchResult[]>([]); const [query,setQuery]=useState(''); const [category,setCategory]=useState<string|null>(initialCategory);
 useEffect(()=>{let active=true;void discoverPeople().then(items=>{if(active)setRealPeople(items)}).catch(error=>console.warn('CONECTA Explore real profiles unavailable; demo preserved',error));return()=>{active=false}},[]);
 const people=useMemo<ExplorePerson[]>(()=>{const names=new Set(demoPeople.map(p=>normalize(p.name)));const remote=realPeople.filter(p=>!names.has(normalize(p.name))).map(p=>({id:p.id,name:p.name,distance:p.city||'Cerca de ti',photo:p.avatar||fallbackAvatar,tags:[p.username?`@${p.username}`:'CONECTA',p.city||'Comunidad'].filter(Boolean),city:p.city}));return [...demoPeople,...remote]},[realPeople]);
 const plans=useMemo(()=>{const aliases:Record<string,string[]>={'Gastronomía':['Gastronomía','Comida','Café'],'Ocio':['Ocio','Cine','Música'],'Deporte':['Deporte'],'Viajes':['Viajes'],'Naturaleza':['Naturaleza'],'Cultura':['Cultura']};return extraPlans.filter(plan=>!category||(aliases[category]||[category]).some(value=>normalize(plan.category)===normalize(value))).filter(plan=>planMatchesFilter(plan,initialFilter)).filter(plan=>!query.trim()||normalize(`${plan.title} ${plan.place} ${plan.category}`).includes(normalize(query))).slice(0,20)},[extraPlans,category,initialFilter,query]);
 return <main className="page explore-page explore-live" aria-label="Explora">
  <header className="explore-heading explore-heading-minimal"><h1>Explora</h1></header><div className="explore-search-real"><Search/><input aria-label="Buscar planes" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar plan, lugar o categoría…"/></div>
  <section className="explore-live-section status-zone"><div className="explore-live-title"><div><h2>Estados <small>● {people.length} conectados ahora</small></h2><p>Momentos del día · disponibles solo 24 h</p></div><span>Ver todos →</span></div><div className="live-statuses"><button className="live-status add"><i><Plus/></i><b>Tu estado</b></button>{people.slice(0,8).map((p,i)=><button className="live-status" key={p.id||p.name} onClick={()=>p.id&&onChat({name:p.name,userId:p.id})}><i><img src={p.photo} alt=""/><em/></i><b>{p.name}</b>{i===3&&<small><Zap/> Ahora</small>}</button>)}</div></section>
  <section className="explore-live-section profile-posts-zone"><div className="explore-live-title"><div className="profile-posts-heading"><ImageIcon/><div><h2>Publicaciones en el perfil</h2><p>Contenido permanente compartido en los perfiles</p></div></div><span>Ver todas →</span></div><div className="live-stories profile-posts">{stories.map((s,i)=><article className="live-story profile-post" key={s.name}><img src={s.photo} alt=""/><div className="story-person"><img src={demoPeople[i].photo} alt=""/><span><b>{s.name}</b><small>{s.time}</small></span></div><div className="story-copy"><strong>{s.title}</strong></div><div className="profile-post-actions"><span><Heart/> {[24,18,32,15][i]}</span><span><MessageCircle/> {[5,3,4,2][i]}</span></div></article>)}</div></section>
  <section className="explore-live-section"><div className="explore-live-title"><div><h2>Personas para conectar</h2><p>Gente con tus mismos intereses</p></div><span>Ver todas →</span></div><div className="connect-people">{people.slice(0,6).map((p,i)=><button className="connect-card" key={p.id||p.name} onClick={()=>p.id&&onChat({name:p.name,userId:p.id})}><div><img src={p.photo} alt=""/><b>{[92,88,86,82,80,78][i]||78}%</b><em/></div><strong>{p.name}{p.age?`, ${p.age}`:''}</strong><small>{p.tags.slice(0,2).join(' · ')}</small><span><Users/> {Math.max(2,4-i)} intereses en común</span></button>)}</div></section>
  {plans.length>0&&<section className="explore-live-section"><div className="explore-live-title"><h2>Planes que están despegando 🚀</h2><span>Ver todos →</span></div><div className="trending-plans">{plans.map(plan=><button key={plan.backendId||`${plan.title}-${plan.time}`} onClick={()=>onPlan(plan)}><img src={plan.image||fallbackAvatar} alt=""/><span><strong>{plan.title}</strong><small>{plan.distance} · {plan.time}</small><em>{plan.category}</em></span></button>)}</div></section>}
  <section className="explore-live-section"><div className="explore-live-title"><h2>Explora por categorías</h2><span>Ver todas →</span></div><div className="explore-categories">{categories.map(([name,photo])=><button key={name} className={category===name?'active':''} onClick={()=>setCategory(current=>current===name?null:name)}><img src={img(photo)} alt=""/><b>{name}</b></button>)}</div></section>
  <button className="explore-recommend"><Sparkles/><span><b>Plan recomendado para ti</b><small>Según tus intereses y disponibilidad</small></span><strong>→</strong></button>
 </main>;
}