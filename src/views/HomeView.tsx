import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, Coffee, CreditCard, Heart, MapPin, Music2, Sparkles } from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { PlanCards } from '../components/PlanComponents';
import { categories, people, plans } from '../data/demoData';
import { blockedNames, canUseLocation, loadPrivacySettings } from '../lib/privacy';
import { loadSocialSummary, type SocialSummary } from '../lib/socialSummaryBackend';
import type { HomeBrowseMode, Plan, View } from '../types';

const emptySummary:SocialSummary={attendedThisWeek:0,attendedLast7Days:0,streakWeeks:0,topCategory:null,nextPlan:null,weekPlans:[],upcomingPlans:[]};
const categoryOrder=['Deporte','Café','Comida','Playa','Música','Viajes'];

function nextPlanDate(value:string){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return 'Fecha por confirmar';
  return new Intl.DateTimeFormat('es-ES',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(date);
}

export function HomeView({setView,onPlan,onBrowse}:{setView:(v:View)=>void,onPlan:(p:Plan)=>void,onBrowse:(mode:HomeBrowseMode,category?:string|null)=>void}){
  const [privacy]=useState(loadPrivacySettings);
  const [blocked]=useState<Set<string>>(()=>blockedNames());
  const [summary,setSummary]=useState<SocialSummary>(emptySummary);
  const [summaryReady,setSummaryReady]=useState(false);
  const locationAllowed=canUseLocation(privacy);

  useEffect(()=>{
    let active=true;
    void loadSocialSummary()
      .then(value=>{if(active)setSummary(value)})
      .catch(error=>console.warn('CONECTA next plan unavailable; demo plan kept',error))
      .finally(()=>{if(active)setSummaryReady(true)});
    return ()=>{active=false};
  },[]);

  const homeCategories=useMemo(()=>categoryOrder.map(name=>categories.find(([category])=>category===name)).filter(Boolean) as (readonly [string,string])[],[]);
  const allowedPeople=useMemo(()=>people.filter(person=>!blocked.has(person.name)),[blocked]);
  const imageFor=(name:string,fallback:string)=>categories.find(([category])=>category===name)?.[1]||fallback;

  const featuredPlan:Plan=summaryReady&&summary.nextPlan?{
    backendId:summary.nextPlan.id,
    title:summary.nextPlan.title,
    image:plans[5]?.image||plans[0].image,
    time:nextPlanDate(summary.nextPlan.startsAt),
    startsAt:summary.nextPlan.startsAt,
    place:summary.nextPlan.location||'Centre de Reus',
    distance:'',
    spots:'Plan confirmado',
    category:summary.nextPlan.category||'Plan'
  }:{
    title:'Concierto local en Reus',
    image:plans[5]?.image||plans[0].image,
    time:'Mar, 8 sept · 22:37',
    place:'Centre de Reus',
    distance:'12 km',
    spots:'16 personas van',
    category:'Música'
  };

  const nearbyPlans:Plan[]=[
    {title:'Entreno en grupo',image:imageFor('Deporte',plans[0].image),time:'Hoy · 19:00',place:'Vila-seca',distance:'2 km',spots:'+8',category:'Deporte'},
    {title:'Tapas en el centro',image:imageFor('Comida',plans[1].image),time:'Hoy · 21:00',place:'Tarragona',distance:'4 km',spots:'+5',category:'Comida'},
    {title:'Atardecer y charlas',image:'./assets/images/photo-1507525428034-b723cf961d3e.jpg',time:'Mañana · 17:00',place:'La Pineda',distance:'7 km',spots:'+12',category:'Playa'}
  ];

  const compatiblePeople=[
    {name:'Laura',age:26,match:'92%',tags:['Viajes','Café'],image:allowedPeople.find(person=>person.name==='Laura')?.image||people[2].image},
    {name:'Sergio',age:28,match:'88%',tags:['Deporte','Naturaleza'],image:allowedPeople.find(person=>person.name==='Javi')?.image||people[1].image},
    {name:'Marta',age:24,match:'86%',tags:['Música','Planes'],image:allowedPeople.find(person=>person.name==='Marta')?.image||people[0].image},
    {name:'Álex',age:27,match:'84%',tags:['Comida','Viajes'],image:allowedPeople.find(person=>person.name==='Álex')?.image||people[5].image}
  ];

  const homeEscapes=[
    {title:'Costa Brava',subtitle:'Escapada de fin de semana',image:'./assets/images/photo-1500530855697-b586d89ba3ee.jpg',place:'Costa Brava'},
    {title:'Pirineos',subtitle:'Senderismo y naturaleza',image:'./assets/images/photo-1464822759023-fed622ff2c3b.jpg',place:'Pirineos'},
    {title:'Barcelona',subtitle:'Planes, cultura y más',image:'./assets/images/photo-1539037116277-4db20889f2d4.jpg',place:'Barcelona'}
  ];

  const browse=(mode:HomeBrowseMode,category:string|null=null)=>onBrowse(mode,category);
  const openEscape=(item:(typeof homeEscapes)[number])=>onPlan({title:item.title,image:item.image,time:'Próximo fin de semana',place:item.place,distance:'',spots:'8 plazas',category:'Viajes'});

  return <div className="page home-page home-target">
    <section className="home-target-hero"><img decoding="async" fetchPriority="high" src="./assets/images/photo-1529156069898-49953e39b3ac.jpg" alt="Grupo de amigos disfrutando de un plan"/><div className="home-target-hero-shade"/><div className="home-target-copy"><h1>Vive más<br/>planes <span>juntos</span></h1><p>Conoce gente, organiza planes<br/>y crea experiencias reales.</p><button type="button" onClick={()=>browse('all')}>Explorar planes <ChevronRight/></button></div><div className="home-target-note">Buenas<br/>compañías<br/>mejores historias</div></section>
    <button className="home-target-next" type="button" onClick={()=>onPlan(featuredPlan)}><img src={featuredPlan.image} alt={featuredPlan.title} decoding="async"/><span className="home-target-next-copy"><small>TU PRÓXIMO PLAN</small><strong>{featuredPlan.title}</strong><span className="home-target-meta"><CalendarDays/>{featuredPlan.time}<i/><MapPin/>{featuredPlan.place}</span><span className="home-target-attendees"><span className="home-target-avatars"><img loading="lazy" decoding="async" src={people[0].image} alt="Participante"/><img loading="lazy" decoding="async" src={people[2].image} alt="Participante"/><img loading="lazy" decoding="async" src={people[1].image} alt="Participante"/><b>+12</b></span><em>{featuredPlan.spots}</em></span></span><span className="home-target-next-arrow"><ChevronRight/></span></button>
    <section className="home-target-section"><div className="home-target-head"><h2>Explora por categorías</h2><button onClick={()=>browse('categories')}>Ver todas <ChevronRight/></button></div><div className="home-target-categories">{homeCategories.map(([name,image])=><button key={name} onClick={()=>browse('categories',name)}><img loading="lazy" decoding="async" src={image} alt={name}/><span/><b><CategoryIcon name={name}/>{name}</b></button>)}</div></section>
    <section className="home-target-section"><div className="home-target-head"><h2>Descubre planes cerca de ti</h2><button onClick={()=>browse(locationAllowed?'near':'all')}>Ver todo <ChevronRight/></button></div><div className="home-target-plans">{nearbyPlans.map(plan=><article key={plan.title} role="button" tabIndex={0} onClick={()=>onPlan(plan)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onPlan(plan)}}}><img loading="lazy" decoding="async" src={plan.image} alt={plan.title}/><span className="home-target-card-shade"/><Heart className="home-target-heart"/><div><small>{plan.time}</small><strong>{plan.title}</strong><span><MapPin/>{plan.place}</span><b>{plan.spots}</b></div></article>)}</div></section>
    <section className="home-target-section"><div className="home-target-head home-target-head-sub"><div><h2>Escapadas y eventos</h2><p>Planes más allá de tu ciudad</p></div><button onClick={()=>browse('escapes')}>Ver todas <ChevronRight/></button></div><div className="home-target-escapes">{homeEscapes.map(item=><article key={item.title} role="button" tabIndex={0} onClick={()=>openEscape(item)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openEscape(item)}}}><img loading="lazy" decoding="async" src={item.image} alt={item.title}/><span className="home-target-card-shade"/><Heart className="home-target-heart"/><div><strong>{item.title}</strong><span><MapPin/>{item.subtitle}</span></div></article>)}</div></section>
    <section className="section now-section"><div className="section-head"><div><small>AHORA</small><h2>{locationAllowed?'Qué hacer cerca de ti':'Qué hacer hoy'}</h2></div><button onClick={()=>browse(locationAllowed?'near':'all')}>Explorar <ChevronRight/></button></div><div className="quick-grid"><button onClick={()=>browse('today')}><Sparkles/><strong>Ahora mismo</strong><span>Planes de hoy</span></button><button onClick={()=>browse('afternoon')}><Coffee/><strong>Esta tarde</strong><span>Planes de tarde</span></button><button onClick={()=>browse('tonight')}><Music2/><strong>Esta noche</strong><span>Planes nocturnos</span></button><button onClick={()=>browse('weekend')}><CalendarDays/><strong>Este finde</strong><span>Planes del finde</span></button></div></section>
    <section className="section home-more"><div className="section-head"><div><small>MÁS IDEAS</small><h2>Sigue descubriendo</h2></div><button onClick={()=>browse('all')}>Explorar <ChevronRight/></button></div><PlanCards items={plans.slice(5)} onPlan={onPlan}/></section>
    <section className="home-target-section"><div className="home-target-head home-target-head-sub"><div><h2>Personas compatibles</h2><p>Gente con tus mismos intereses</p></div><button onClick={()=>browse('people')}>Ver todas <ChevronRight/></button></div><div className="home-target-people">{compatiblePeople.map(person=><article key={person.name}><div className="home-target-person-photo"><img loading="lazy" decoding="async" src={person.image} alt={person.name}/><b>{person.match}</b></div><strong><i/>{person.name}, {person.age}</strong><span>{person.tags.join(' · ')}</span></article>)}</div></section>
    <footer className="home-footer-note"><span>CONECTA PREMIUM</span><span>Planes verificados</span><span>Gente compatible</span><span>Más seguridad</span></footer>
    <section className="premium-banner"><div><CreditCard/><span>PREMIUM</span></div><h2>Haz que cada semana tenga algo que esperar</h2><p>Más visibilidad, recomendaciones avanzadas y acceso prioritario a experiencias seleccionadas.</p><button onClick={()=>setView('Ajustes')}>Ver CONECTA Premium <ChevronRight/></button></section>
  </div>
}
