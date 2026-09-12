import { ChevronLeft, MapPin } from 'lucide-react';
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

export function HomeBrowseView({mode,category,onBack,onPlan,onBrowse}:{
  mode:HomeBrowseMode;
  category:string|null;
  onBack:()=>void;
  onPlan:(plan:Plan)=>void;
  onBrowse:(mode:HomeBrowseMode,category?:string|null)=>void;
}){
  const title=category?category:modeTitle[mode];

  return <div className="page home-browse-page">
    <div className="page-title home-browse-title"><div><h1>{title}</h1><p>Descubre opciones desde Inicio</p></div><button type="button" aria-label="Volver a Inicio" onClick={onBack}><ChevronLeft/></button></div>

    {mode==='categories'&&!category&&<section className="home-browse-grid home-browse-categories">{categories.map(([name,image])=><button type="button" key={name} onClick={()=>onBrowse('categories',name)}><img src={image} alt={name}/><span>{name}</span></button>)}</section>}

    {mode==='escapes'&&<section className="home-browse-grid home-browse-escapes">{escapes.map(([name,date,image])=><article key={name} role="button" tabIndex={0} onClick={()=>onPlan({title:name,image,time:date,place:name,distance:'',spots:'8 plazas',category:'Viajes'})} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onPlan({title:name,image,time:date,place:name,distance:'',spots:'8 plazas',category:'Viajes'})}}}><img src={image} alt={name}/><div><strong>{name}</strong><span><MapPin/>{date}</span></div></article>)}</section>}

    {mode==='people'&&<section className="home-browse-grid home-browse-people">{people.map(person=><article key={person.name}><img src={person.image} alt={person.name}/><div><strong>{person.name}, {person.age}</strong><span>{person.match} compatible · {person.distance}</span><small>{person.tags.slice(0,3).join(' · ')}</small></div></article>)}</section>}

    {mode!=='categories'&&mode!=='escapes'&&mode!=='people'&&<PlanCards items={plansFor(mode,category)} onPlan={onPlan}/>} 
    {mode==='categories'&&category&&<PlanCards items={plansFor(mode,category)} onPlan={onPlan}/>} 
  </div>;
}
