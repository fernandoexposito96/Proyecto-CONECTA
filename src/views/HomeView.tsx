import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronRight, Coffee, Crown, MapPin, Music2, Plus, Search, Sparkles, X } from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { PlanCards } from '../components/PlanComponents';
import { categories, escapes, people, plans } from '../data/demoData';
import { blockedNames, canUseLocation, loadPrivacySettings } from '../lib/privacy';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import type { ExploreFilter, Plan, View } from '../types';

const escapePlaces=['Barcelona','Costa Brava','Montseny'] as const;
const escapeDistances=['98 km','142 km','122 km'] as const;

export function HomeView({setView,onPlan,onExplore}:{setView:(v:View)=>void,onPlan:(p:Plan)=>void,onExplore:(filter?:ExploreFilter,category?:string|null)=>void}){
  const [privacy]=useState(loadPrivacySettings);
  const [blocked]=useState<Set<string>>(()=>blockedNames());
  const [heroQuery,setHeroQuery]=useState('');
  const [searchOpen,setSearchOpen]=useState(false);
  const [showAllPeople,setShowAllPeople]=useState(false);
  const [connected,setConnected]=useState<Set<string>>(()=>new Set(loadStored<string[]>(storageKeys.connections,[])));
  const locationAllowed=canUseLocation(privacy);

  useEffect(()=>{saveStored(storageKeys.connections,[...connected])},[connected]);

  const searchResults=useMemo(()=>{
    const q=heroQuery.trim().toLocaleLowerCase('es');
    if(!q)return [];
    return plans.filter(p=>`${p.title} ${p.place} ${p.category}`.toLocaleLowerCase('es').includes(q)).slice(0,4);
  },[heroQuery]);

  const allowedPeople=useMemo(()=>people.filter(person=>!blocked.has(person.name)),[blocked]);
  const visiblePeople=showAllPeople?allowedPeople:allowedPeople.slice(0,4);
  const toggleConnection=(name:string)=>setConnected(prev=>{const next=new Set(prev);next.has(name)?next.delete(name):next.add(name);return next});
  const openExplore=(filter:ExploreFilter='near',category:string|null=null)=>onExplore(filter==='near'&&!locationAllowed?'all':filter,category);
  const openEscape=(title:string,date:string,image:string,index:number)=>onPlan({title,image,time:date,place:escapePlaces[index]||'Cataluña',distance:escapeDistances[index]||'100 km',spots:'8 plazas',category:'Viajes'});

  return <div className="page home-page">
    <section className="hero"><img decoding="async" fetchPriority="high" src="./assets/images/photo-1529156069898-49953e39b3ac.jpg" alt="Grupo de amigos disfrutando de un plan"/><div className="hero-overlay"/><div className="hero-copy"><span><MapPin/> {locationAllowed?'Tarragona':'Ubicación privada'}</span><h1>La vida es mejor<br/>con buenos planes</h1><div className="hero-search-wrap"><div className="hero-search"><Search/><input value={heroQuery} onFocus={()=>setSearchOpen(true)} onChange={e=>{setHeroQuery(e.target.value);setSearchOpen(true)}} onKeyDown={e=>{if(e.key==='Enter'&&searchResults[0])onPlan(searchResults[0])}} placeholder="¿Qué te apetece hacer hoy?" aria-label="Buscar planes desde Inicio"/>{heroQuery&&<button type="button" aria-label="Limpiar búsqueda" onClick={()=>{setHeroQuery('');setSearchOpen(false)}}><X/></button>}</div>{searchOpen&&heroQuery.trim()&&<div className="hero-search-results">{searchResults.length?searchResults.map(p=><button key={p.title} onClick={()=>onPlan(p)}><img src={p.image} alt=""/><span><strong>{p.title}</strong><small>{p.place}{locationAllowed?` · ${p.distance}`:''}</small></span><ChevronRight/></button>):<div className="hero-search-empty">No hay planes que coincidan.</div>}<button className="hero-search-all" onClick={()=>openExplore('all')}>Ver todos los planes <ChevronRight/></button></div>}</div></div></section>
    <section className="section"><div className="section-head"><h2>Descubre</h2><button onClick={()=>openExplore('all')}>Ver todo <ChevronRight/></button></div><div className="category-strip">{categories.slice(0,12).map(([name,image])=><button key={name} onClick={()=>openExplore('all',name)}><img loading="lazy" decoding="async" src={image} alt={name}/><span className="shade"/><b><CategoryIcon name={name}/>{name}</b></button>)}</div></section>
    <section className="section"><div className="section-head"><div><small>PARA TI</small><h2>Planes para ti</h2></div><button onClick={()=>openExplore('all')}>Ver todos <ChevronRight/></button></div><PlanCards items={plans.slice(0,5)} onPlan={onPlan}/></section>
    <section className="section now-section"><div className="section-head"><div><small>AHORA</small><h2>{locationAllowed?'Qué hacer cerca de ti':'Qué hacer hoy'}</h2></div><button onClick={()=>openExplore(locationAllowed?'near':'all')}>Explorar <ChevronRight/></button></div><div className="quick-grid"><button onClick={()=>openExplore('today')} aria-label="Explorar planes ahora mismo"><Sparkles/><strong>Ahora mismo</strong><span>Planes de hoy</span></button><button onClick={()=>openExplore('afternoon')} aria-label="Explorar planes para esta tarde"><Coffee/><strong>Esta tarde</strong><span>Planes de tarde</span></button><button onClick={()=>openExplore('tonight')} aria-label="Explorar planes para esta noche"><Music2/><strong>Esta noche</strong><span>Planes nocturnos</span></button><button onClick={()=>openExplore('weekend')} aria-label="Explorar planes para este fin de semana"><CalendarDays/><strong>Este finde</strong><span>Planes del finde</span></button></div></section>
    <section className="section"><div className="section-head"><div><small>COMPATIBILIDAD</small><h2>Personas para ti</h2></div><button onClick={()=>setShowAllPeople(v=>!v)}>{showAllPeople?'Ver menos':'Ver más'} <ChevronRight/></button></div><div className="people-strip">{visiblePeople.map(person=><article key={person.name}><img loading="lazy" decoding="async" src={person.image} alt={person.name}/><div><strong>{person.name}</strong><b>{person.match} compatible</b><span>{person.tags.slice(0,2).join(' · ')}</span></div><button className={connected.has(person.name)?'is-connected':''} aria-label={connected.has(person.name)?`Cancelar conexión con ${person.name}`:`Conectar con ${person.name}`} aria-pressed={connected.has(person.name)} onClick={()=>toggleConnection(person.name)}>{connected.has(person.name)?<Check/>:<Plus/>}</button></article>)}</div></section>
    <section className="section escape-section"><div className="section-head"><div><small>ESCAPADAS</small><h2>Sal de la rutina</h2></div><button className="escape-view-all" onClick={()=>openExplore('weekend')}>Ver más <ChevronRight/></button></div><div className="escape-grid">{escapes.map(([title,date,image],index)=><article key={title} role="button" tabIndex={0} onClick={()=>openEscape(title,date,image,index)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')openEscape(title,date,image,index)}}><img loading="lazy" decoding="async" src={image} alt={title}/><div><strong>{title}</strong><span>{date}</span></div></article>)}</div></section>
    <section className="section"><div className="section-head"><div><small>MÁS IDEAS</small><h2>Sigue descubriendo</h2></div><button onClick={()=>openExplore('all')}>Explorar <ChevronRight/></button></div><PlanCards items={plans.slice(5)} onPlan={onPlan}/></section>
    <section className="premium-banner"><div><Crown/><span>PREMIUM</span></div><h2>Haz que cada semana tenga algo que esperar</h2><p>Más visibilidad, recomendaciones avanzadas y acceso prioritario a experiencias seleccionadas.</p><button onClick={()=>setView('Ajustes')}>Ver CONECTA Premium <ChevronRight/></button></section>
    <footer className="home-footer-note" aria-label="Ventajas de CONECTA Premium"><span>CONECTA PREMIUM</span><span>Planes verificados</span><span>Gente compatible</span><span>Más seguridad</span></footer>
  </div>
}
