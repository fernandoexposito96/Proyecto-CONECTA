import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { PlanCards } from '../components/PlanComponents';
import { categories, plans } from '../data/demoData';
import type { Plan } from '../types';

type TimeFilter='all'|'near'|'today'|'weekend';

export function ExploreView({onPlan}:{onPlan:(p:Plan)=>void}){
  const [timeFilter,setTimeFilter]=useState<TimeFilter>('near');
  const [category,setCategory]=useState<string|null>(null);
  const [searchOpen,setSearchOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [sortAsc,setSortAsc]=useState(true);

  const visible=useMemo(()=>{
    let list=plans.filter(p=>{
      if(category&&p.category!==category)return false;
      const q=query.trim().toLocaleLowerCase('es');
      if(q&&!`${p.title} ${p.place} ${p.category}`.toLocaleLowerCase('es').includes(q))return false;
      if(timeFilter==='today')return p.time.startsWith('Hoy');
      if(timeFilter==='weekend')return /Vie|Sáb|Dom/.test(p.time);
      return true;
    });
    if(timeFilter==='near'||sortAsc){
      list=[...list].sort((a,b)=>parseFloat(a.distance)-parseFloat(b.distance));
    }else{
      list=[...list].sort((a,b)=>parseFloat(b.distance)-parseFloat(a.distance));
    }
    return list;
  },[category,query,timeFilter,sortAsc]);

  return <div className="page explore-page">
    <div className="page-title"><div><h1>Explora</h1><p>Descubre planes cerca de ti</p></div><button aria-label="Buscar planes" onClick={()=>setSearchOpen(v=>!v)}>{searchOpen?<X/>:<Search/>}</button></div>
    {searchOpen&&<div className="explore-search"><Search/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar plan, lugar o categoría" aria-label="Buscar plan, lugar o categoría"/></div>}
    <div className="filter-row">
      <button className={timeFilter==='near'?'active':''} onClick={()=>setTimeFilter('near')}>Cerca de mí</button>
      <button className={timeFilter==='today'?'active':''} onClick={()=>setTimeFilter('today')}>Hoy</button>
      <button className={timeFilter==='weekend'?'active':''} onClick={()=>setTimeFilter('weekend')}>Este finde</button>
      <button className={timeFilter==='all'?'active':''} onClick={()=>{setTimeFilter('all');setSortAsc(v=>!v)}}>Ordenar · {sortAsc?'cerca':'lejos'}</button>
    </div>
    <div className="category-grid">{categories.map(([name,image])=><button key={name} className={category===name?'active':''} onClick={()=>setCategory(v=>v===name?null:name)} aria-pressed={category===name}><img loading="lazy" decoding="async" src={image} alt={name}/><span/><b><CategoryIcon name={name}/>{name}</b></button>)}</div>
    <section className="section noframe"><div className="section-head"><h2>{category||'Recomendados'}</h2>{category&&<button onClick={()=>setCategory(null)}>Ver todos</button>}</div>{visible.length?<PlanCards items={visible} onPlan={onPlan}/>:<div className="empty-state">No hay planes que coincidan con estos filtros.</div>}</section>
  </div>
}
