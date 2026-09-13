import { useEffect } from 'react';
import { CalendarDays, ChevronLeft, Heart, MapPin } from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { PlanCards } from '../components/PlanComponents';
import { categories, escapes, people, plans } from '../data/demoData';
import type { HomeBrowseMode, Plan } from '../types';

const modeTitle:Record<HomeBrowseMode,string>={
  all:'Explorar planes',
  categories:'Categorías',
  near:'Planes cerca de ti',
  today:'Planes de hoy',
  afternoon:'Esta tarde',
  tonight:'Esta noche',
  weekend:'Este finde',
  escapes:'Escapadas y eventos',
  people:'Personas compatibles',
};

function plansFor(mode:HomeBrowseMode,category:string|null):Plan[]{
  if(category)return plans.filter(plan=>plan.category===category);
  if(mode==='near')return plans.slice(0,6);
  if(mode==='today')return plans.filter(plan=>plan.time.startsWith('Hoy'));
  if(mode==='afternoon')return plans.filter(plan=>/17:|18:|19:/.test(plan.time));
  if(mode==='tonight')return plans.filter(plan=>/20:|21:|22:/.test(plan.time));
  if(mode==='weekend')return plans.filter(plan=>/Sáb|Dom|Vie/.test(plan.time));
  return plans;
}

function cleanMatch(value:string){
  const parsed=Number.parseInt(value.replace(/[^0-9]/g,''),10);
  if(Number.isNaN(parsed))return value;
  return `${Math.min(100,Math.max(0,parsed))}%`;
}

export function HomeBrowseView({mode,category,onBack,onPlan,onBrowse}:{
  mode:HomeBrowseMode;
  category:string|null;
  onBack:()=>void;
  onPlan:(plan:Plan)=>void;
  onBrowse:(mode:HomeBrowseMode,category?:string|null)=>void;
}){
  const title=category?category:modeTitle[mode];
  const visiblePlans=plansFor(mode,category);

  useEffect(()=>{
    window.scrollTo({top:0,behavior:'auto'});
  },[mode,category]);

  return <div className="page home-browse-page home-browse-premium">
    <span className="home-browse-blob home-browse-blob-a"/>
    <span className="home-browse-blob home-browse-blob-b"/>

    <header className="home-browse-header">
      <div className="home-browse-heading">
        <small>CONECTA</small>
        <h1>{title}</h1>
        <p>Descubre opciones desde Inicio</p>
      </div>
      <button className="home-browse-back" type="button" aria-label="Volver a Inicio" onClick={onBack}><ChevronLeft/></button>
    </header>

    {(mode==='near'||mode==='all')&&!category&&<div className="home-browse-filter-row" aria-label="Filtros rápidos">
      <button className="active" type="button">Todos</button>
      {['Deporte','Comida','Cine','Música'].map(name=><button type="button" key={name} onClick={()=>onBrowse('categories',name)}><CategoryIcon name={name}/>{name}</button>)}
    </div>}

    {mode==='categories'&&!category&&<section className="home-browse-grid home-browse-categories" aria-label="Categorías">{categories.map(([name,image])=><button type="button" key={name} onClick={()=>onBrowse('categories',name)}><img loading="lazy" decoding="async" src={image} alt=""/><span className="home-browse-category-label"><CategoryIcon name={name}/>{name}</span><b>›</b></button>)}</section>}

    {mode==='escapes'&&<section className="home-browse-grid home-browse-escapes" aria-label="Escapadas y eventos">{escapes.map(([name,date,image])=><article key={name} role="button" tabIndex={0} onClick={()=>onPlan({title:name,image,time:date,place:name,distance:'',spots:'8 plazas',category:'Viajes'})} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onPlan({title:name,image,time:date,place:name,distance:'',spots:'8 plazas',category:'Viajes'})}}}><img loading="lazy" decoding="async" src={image} alt=""/><div><strong>{name}</strong><span><MapPin/>{date}</span></div></article>)}</section>}

    {mode==='people'&&<section className="home-browse-grid home-browse-people" aria-label="Personas compatibles">{people.map(person=><article className="home-browse-person" key={person.name}>
      <div className="home-browse-person-photo"><img loading="lazy" decoding="async" src={person.image} alt={`Foto de ${person.name}`}/><button type="button" aria-label={`Guardar ${person.name}`}><Heart/></button><span>{cleanMatch(person.match)} compatible</span></div>
      <div className="home-browse-person-body">
        <div className="home-browse-person-main"><strong>{person.name}, {person.age}</strong><span>{person.distance}</span></div>
        <div className="home-browse-person-tags">{person.tags.slice(0,3).map(tag=><span key={tag}>{tag}</span>)}</div>
        <p>{person.bio}</p>
      </div>
    </article>)}</section>}

    {mode!=='categories'&&mode!=='escapes'&&mode!=='people'&&<section className="home-browse-plan-grid" aria-label={title}>{visiblePlans.map(plan=><article className="home-browse-plan-card" key={`${plan.title}-${plan.time}`} role="button" tabIndex={0} onClick={()=>onPlan(plan)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onPlan(plan)}}}>
      <div className="home-browse-plan-image"><img loading="lazy" decoding="async" src={plan.image} alt={plan.title}/><button type="button" aria-label={`Guardar ${plan.title}`} onClick={event=>event.stopPropagation()}><Heart/></button><span><CategoryIcon name={plan.category}/>{plan.category}</span></div>
      <div className="home-browse-plan-body"><strong>{plan.title}</strong><span><CalendarDays/>{plan.time}</span><span><MapPin/>{plan.distance||plan.place}{plan.spots?` · ${plan.spots}`:''}</span><div className="home-browse-plan-avatars">{people.slice(0,3).map(person=><img key={person.name} src={person.image} alt="" loading="lazy" decoding="async"/>)}<b>+3</b></div></div>
    </article>)}</section>}

    {mode==='categories'&&category&&<PlanCards items={visiblePlans} onPlan={onPlan}/>} 
  </div>;
}
