import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronRight, Coffee, Crown, MapPin, Music2, Plus, Search, Sparkles, X } from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { PlanCards } from '../components/PlanComponents';
import { categories, escapes, people, plans } from '../data/demoData';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import type { ExploreFilter, Plan, View } from '../types';

const extraPeople = [
  ['Nuria','84% compatible','Senderismo · Café','https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=85'],
  ['Álex','82% compatible','Música · Viajes','https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=160&q=85'],
  ['Sara','80% compatible','Fotografía · Playa','https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=85'],
  ['David','78% compatible','Running · Cine','https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=85']
] as const;

export function HomeView({setView,onPlan,onExplore}:{setView:(v:View)=>void,onPlan:(p:Plan)=>void,onExplore:(filter?:ExploreFilter)=>void}){
  const [heroQuery,setHeroQuery]=useState('');
  const [searchOpen,setSearchOpen]=useState(false);
  const [showAllPeople,setShowAllPeople]=useState(false);
  const [connected,setConnected]=useState<Set<string>>(()=>new Set(loadStored<string[]>(storageKeys.connections,[])));

  useEffect(()=>{saveStored(storageKeys.connections,[...connected])},[connected]);

  const searchResults=useMemo(()=>{
    const q=heroQuery.trim().toLocaleLowerCase('es');
    if(!q)return [];
    return plans.filter(p=>`${p.title} ${p.place} ${p.category}`.toLocaleLowerCase('es').includes(q)).slice(0,4);
  },[heroQuery]);

  const allPeople=[...people,...extraPeople];
  const visiblePeople=showAllPeople?allPeople:people;
  const toggleConnection=(name:string)=>setConnected(prev=>{const next=new Set(prev);next.has(name)?next.delete(name):next.add(name);return next});
  const openExplore=(filter:ExploreFilter='near')=>onExplore(filter);

  return <div className="page home-page">
    <section className="hero"><img decoding="async" fetchPriority="high" src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=90" alt="Grupo de amigos disfrutando de un plan"/><div className="hero-overlay"/><div className="hero-copy"><span><MapPin/> Tarragona</span><h1>La vida es mejor<br/>con buenos planes</h1><div className="hero-search-wrap"><div className="hero-search"><Search/><input value={heroQuery} onFocus={()=>setSearchOpen(true)} onChange={e=>{setHeroQuery(e.target.value);setSearchOpen(true)}} onKeyDown={e=>{if(e.key==='Enter'&&searchResults[0])onPlan(searchResults[0])}} placeholder="¿Qué te apetece hacer hoy?" aria-label="Buscar planes desde Inicio"/>{heroQuery&&<button type="button" aria-label="Limpiar búsqueda" onClick={()=>{setHeroQuery('');setSearchOpen(false)}}><X/></button>}</div>{searchOpen&&heroQuery.trim()&&<div className="hero-search-results">{searchResults.length?searchResults.map(p=><button key={p.title} onClick={()=>onPlan(p)}><img src={p.image} alt=""/><span><strong>{p.title}</strong><small>{p.place} · {p.distance}</small></span><ChevronRight/></button>):<div className="hero-search-empty">No hay planes que coincidan.</div>}<button className="hero-search-all" onClick={()=>openExplore('all')}>Ver todos los planes <ChevronRight/></button></div>}</div></div></section>
    <section className="section"><div className="section-head"><h2>Descubre</h2><button onClick={()=>openExplore('all')}>Ver todo <ChevronRight/></button></div><div className="category-strip">{categories.slice(0,12).map(([name,image])=><button key={name} onClick={()=>openExplore('all')}><img loading="lazy" decoding="async" src={image} alt={name}/><span className="shade"/><b><CategoryIcon name={name}/>{name}</b></button>)}</div></section>
    <section className="section"><div className="section-head"><div><small>PARA TI</small><h2>Planes para ti</h2></div><button onClick={()=>openExplore('all')}>Ver todos <ChevronRight/></button></div><PlanCards items={plans.slice(0,5)} onPlan={onPlan}/></section>
    <section className="section now-section"><div className="section-head"><div><small>AHORA</small><h2>Qué hacer cerca de ti</h2></div><button onClick={()=>openExplore('near')}>Explorar <ChevronRight/></button></div><div className="quick-grid"><button onClick={()=>openExplore('today')} aria-label="Explorar planes ahora mismo"><Sparkles/><strong>Ahora mismo</strong><span>Planes de hoy</span></button><button onClick={()=>openExplore('afternoon')} aria-label="Explorar planes para esta tarde"><Coffee/><strong>Esta tarde</strong><span>Planes de tarde</span></button><button onClick={()=>openExplore('tonight')} aria-label="Explorar planes para esta noche"><Music2/><strong>Esta noche</strong><span>Planes nocturnos</span></button><button onClick={()=>openExplore('weekend')} aria-label="Explorar planes para este fin de semana"><CalendarDays/><strong>Este finde</strong><span>Planes del finde</span></button></div></section>
    <section className="section"><div className="section-head"><div><small>COMPATIBILIDAD</small><h2>Personas para ti</h2></div><button onClick={()=>setShowAllPeople(v=>!v)}>{showAllPeople?'Ver menos':'Ver más'} <ChevronRight/></button></div><div className="people-strip">{visiblePeople.map(([name,match,tags,image])=><article key={name}><img loading="lazy" decoding="async" src={image} alt={name}/><div><strong>{name}</strong><b>{match}</b><span>{tags}</span></div><button className={connected.has(name)?'is-connected':''} aria-label={connected.has(name)?`Cancelar conexión con ${name}`:`Conectar con ${name}`} aria-pressed={connected.has(name)} onClick={()=>toggleConnection(name)}>{connected.has(name)?<Check/>:<Plus/>}</button></article>)}</div></section>
    <section className="section escape-section"><div className="section-head"><div><small>ESCAPADAS</small><h2>Sal de la rutina</h2></div><button className="escape-view-all" onClick={()=>openExplore('weekend')}>Ver más <ChevronRight/></button></div><div className="escape-grid">{escapes.map(([title,date,image])=><article key={title}><img loading="lazy" decoding="async" src={image} alt={title}/><div><strong>{title}</strong><span>{date}</span></div></article>)}</div></section>
    <section className="section"><div className="section-head"><div><small>MÁS IDEAS</small><h2>Sigue descubriendo</h2></div><button onClick={()=>openExplore('all')}>Explorar <ChevronRight/></button></div><PlanCards items={plans.slice(5)} onPlan={onPlan}/></section>
    <section className="premium-banner"><div><Crown/><span>PREMIUM</span></div><h2>Haz que cada semana tenga algo que esperar</h2><p>Más visibilidad, recomendaciones avanzadas y acceso prioritario a experiencias seleccionadas.</p><button onClick={()=>setView('Ajustes')}>Ver CONECTA Premium <ChevronRight/></button></section>
  </div>
}
