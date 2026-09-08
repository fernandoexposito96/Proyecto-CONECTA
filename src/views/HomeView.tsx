import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronRight, Coffee, Crown, Music2, Plus, Sparkles } from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { PlanCards } from '../components/PlanComponents';
import { categories, escapes, people, plans } from '../data/demoData';
import { blockedNames, canUseLocation, loadPrivacySettings } from '../lib/privacy';
import { removeBackendConnection, requestBackendConnection } from '../lib/socialBackend';
import { loadSocialSummary, type SocialSummary } from '../lib/socialSummaryBackend';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import type { ExploreFilter, Person, Plan, View } from '../types';

const escapePlaces=['Barcelona','Costa Brava','Montseny'] as const;
const escapeDistances=['98 km','142 km','122 km'] as const;
const emptySummary:SocialSummary={attendedThisWeek:0,attendedLast7Days:0,streakWeeks:0,topCategory:null,nextPlan:null,weekPlans:[],upcomingPlans:[]};

const approvedHomeStyles=`
.home-approved-hero{position:relative}
.home-approved-hero .hero-overlay{background:linear-gradient(90deg,rgba(23,17,58,.68) 0%,rgba(35,23,79,.34) 42%,rgba(35,23,79,.04) 74%),linear-gradient(180deg,rgba(20,14,46,.02),rgba(20,14,46,.12))}
.home-approved-copy{position:absolute;z-index:3;left:34px;top:44px;max-width:470px;color:#fff;text-align:left}
.home-approved-copy h1{margin:0;font-size:52px;line-height:.95;letter-spacing:-.055em;color:#fff;text-shadow:0 5px 22px rgba(14,9,38,.30)}
.home-approved-copy h1 span{color:#c59aff}
.home-approved-copy p{max-width:390px;margin:15px 0 18px;font-size:17px;line-height:1.35;font-weight:650;color:#fff;text-shadow:0 3px 14px rgba(14,9,38,.35)}
.home-approved-copy button{display:flex;align-items:center;gap:6px;padding:12px 17px;border:0;border-radius:999px;background:linear-gradient(135deg,#7448f5,#9568ff);color:#fff;font-weight:850;box-shadow:0 12px 28px rgba(71,41,184,.34)}
.home-approved-copy button svg{width:18px}
.home-approved-next{box-sizing:border-box;width:100%;margin:14px 0 0;display:grid;grid-template-columns:122px minmax(0,1fr) 38px;align-items:center;gap:14px;padding:12px 15px;border:0;border-radius:24px;text-align:left;color:#fff;background:radial-gradient(circle at 90% 35%,rgba(255,255,255,.13),transparent 22%),linear-gradient(120deg,#5b32e8 0%,#7448f4 50%,#936dff 100%);box-shadow:0 16px 34px rgba(89,57,211,.22);overflow:hidden}
.home-approved-next>img{display:block;width:122px;height:90px;max-width:none;border-radius:17px;object-fit:cover;border:2px solid rgba(255,255,255,.76);box-shadow:0 8px 20px rgba(28,14,94,.24)}
.home-approved-next-copy{min-width:0;display:grid;gap:4px;color:#fff}
.home-approved-next-copy small{font-size:10px;font-weight:900;letter-spacing:.12em;opacity:.82;color:#fff}
.home-approved-next-copy strong{font-size:21px;line-height:1.05;letter-spacing:-.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}
.home-approved-next-copy>span{display:flex;align-items:center;gap:5px;font-size:12px;opacity:.94;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}
.home-approved-next-copy>span svg{width:15px;height:15px;flex:none}
.home-approved-next-copy em{font-size:11px;font-style:normal;font-weight:750;opacity:.92;color:#fff}
.home-approved-next>svg{width:23px;height:23px;color:#fff;justify-self:end}
@media(max-width:760px){
  .home-approved-hero{height:214px}
  .home-approved-copy{left:18px;right:18px;top:25px;max-width:282px}
  .home-approved-copy h1{font-size:36px;line-height:.94}
  .home-approved-copy p{max-width:255px;margin:10px 0 12px;font-size:12px;line-height:1.34}
  .home-approved-copy button{padding:9px 13px;font-size:12px}
  .home-approved-next{grid-template-columns:86px minmax(0,1fr) 24px;gap:9px;margin-top:11px;padding:9px 10px;border-radius:19px;min-height:88px}
  .home-approved-next>img{width:86px;height:68px;border-radius:14px}
  .home-approved-next-copy{gap:2px}
  .home-approved-next-copy small{font-size:8px}
  .home-approved-next-copy strong{font-size:15px}
  .home-approved-next-copy>span{font-size:9px}
  .home-approved-next-copy>span svg{width:12px;height:12px}
  .home-approved-next-copy em{font-size:9px}
  .home-approved-next>svg{width:18px;height:18px}
}
@media(max-width:390px){
  .home-approved-hero{height:202px}
  .home-approved-copy{left:15px;top:23px}
  .home-approved-copy h1{font-size:33px}
  .home-approved-next{grid-template-columns:80px minmax(0,1fr) 20px;gap:8px;padding:8px 9px}
  .home-approved-next>img{width:80px;height:64px}
  .home-approved-next-copy strong{font-size:14px}
}
`;

function nextPlanDate(value:string){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return 'Fecha por confirmar';
  return new Intl.DateTimeFormat('es-ES',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(date);
}

export function HomeView({setView,onPlan,onExplore}:{setView:(v:View)=>void,onPlan:(p:Plan)=>void,onExplore:(filter?:ExploreFilter,category?:string|null)=>void}){
  const [privacy]=useState(loadPrivacySettings);
  const [blocked]=useState<Set<string>>(()=>blockedNames());
  const [showAllPeople,setShowAllPeople]=useState(false);
  const [connected,setConnected]=useState<Set<string>>(()=>new Set(loadStored<string[]>(storageKeys.connections,[])));
  const [summary,setSummary]=useState<SocialSummary>(emptySummary);
  const [summaryReady,setSummaryReady]=useState(false);
  const locationAllowed=canUseLocation(privacy);

  useEffect(()=>{saveStored(storageKeys.connections,[...connected])},[connected]);
  useEffect(()=>{
    let active=true;
    void loadSocialSummary()
      .then(value=>{if(active)setSummary(value)})
      .catch(error=>console.warn('CONECTA weekly summary unavailable; empty summary kept',error))
      .finally(()=>{if(active)setSummaryReady(true)});
    return ()=>{active=false};
  },[]);

  const allowedPeople=useMemo(()=>people.filter(person=>!blocked.has(person.name)),[blocked]);
  const visiblePeople=showAllPeople?allowedPeople:allowedPeople.slice(0,4);
  const featuredPlan:Plan=summaryReady&&summary.nextPlan?{
    title:summary.nextPlan.title,
    image:plans[5]?.image||plans[0].image,
    time:nextPlanDate(summary.nextPlan.startsAt),
    place:summary.nextPlan.location||'Tarragona',
    distance:'',
    spots:'16 personas van',
    category:'Música'
  }:{
    title:'Concierto local en Reus',
    image:plans[5]?.image||plans[0].image,
    time:'Hoy · 22:37',
    place:'Centre de Reus',
    distance:'12 km',
    spots:'16 personas van',
    category:'Música'
  };

  const toggleConnection=(person:Person)=>{
    const name=person.name;
    const wasConnected=connected.has(name);
    setConnected(prev=>{
      const next=new Set(prev);
      wasConnected?next.delete(name):next.add(name);
      return next;
    });
    if(!person.userId)return;
    const operation=wasConnected?removeBackendConnection(person.userId):requestBackendConnection(person.userId);
    void operation.catch(error=>{
      console.warn('CONECTA real connection sync failed; demo state restored',error);
      setConnected(prev=>{
        const next=new Set(prev);
        wasConnected?next.add(name):next.delete(name);
        return next;
      });
    });
  };
  const openExplore=(filter:ExploreFilter='near',category:string|null=null)=>onExplore(filter==='near'&&!locationAllowed?'all':filter,category);
  const openEscape=(title:string,date:string,image:string,index:number)=>onPlan({title,image,time:date,place:escapePlaces[index]||'Cataluña',distance:escapeDistances[index]||'100 km',spots:'8 plazas',category:'Viajes'});

  return <div className="page home-page">
    <style>{approvedHomeStyles}</style>
    <section className="hero home-hero-image home-approved-hero">
      <img decoding="async" fetchPriority="high" src="./assets/images/photo-1529156069898-49953e39b3ac.jpg" alt="Grupo de amigos disfrutando de un plan"/>
      <div className="hero-overlay"/>
      <div className="home-approved-copy">
        <h1>Vive más<br/>planes <span>juntos</span></h1>
        <p>Conoce gente, organiza planes y crea experiencias reales.</p>
        <button type="button" onClick={()=>openExplore('all')}>Explorar planes <ChevronRight/></button>
      </div>
    </section>

    <button className="home-approved-next" type="button" onClick={()=>onPlan(featuredPlan)}>
      <img src={featuredPlan.image} alt={featuredPlan.title} decoding="async"/>
      <span className="home-approved-next-copy">
        <small>TU PRÓXIMO PLAN</small>
        <strong>{featuredPlan.title}</strong>
        <span><CalendarDays/>{featuredPlan.time} · {featuredPlan.place}</span>
        <em>{featuredPlan.spots}</em>
      </span>
      <ChevronRight/>
    </button>

    <section className="section home-discover"><div className="section-head"><h2>Descubre</h2><button onClick={()=>openExplore('all')}>Ver todo <ChevronRight/></button></div><div className="category-strip">{categories.slice(0,12).map(([name,image])=><button key={name} onClick={()=>openExplore('all',name)}><img loading="lazy" decoding="async" src={image} alt={name}/><span className="shade"/><b><CategoryIcon name={name}/>{name}</b></button>)}</div></section>

    <section className="section home-plans"><div className="section-head"><div><small>PARA TI</small><h2>Planes para ti</h2></div><button onClick={()=>openExplore('all')}>Ver todos <ChevronRight/></button></div><PlanCards items={plans.slice(0,5)} onPlan={onPlan}/></section>

    <section className="section now-section"><div className="section-head"><div><small>AHORA</small><h2>{locationAllowed?'Qué hacer cerca de ti':'Qué hacer hoy'}</h2></div><button onClick={()=>openExplore(locationAllowed?'near':'all')}>Explorar <ChevronRight/></button></div><div className="quick-grid"><button onClick={()=>openExplore('today')} aria-label="Explorar planes ahora mismo"><Sparkles/><strong>Ahora mismo</strong><span>Planes de hoy</span></button><button onClick={()=>openExplore('afternoon')} aria-label="Explorar planes para esta tarde"><Coffee/><strong>Esta tarde</strong><span>Planes de tarde</span></button><button onClick={()=>openExplore('tonight')} aria-label="Explorar planes para esta noche"><Music2/><strong>Esta noche</strong><span>Planes nocturnos</span></button><button onClick={()=>openExplore('weekend')} aria-label="Explorar planes para este fin de semana"><CalendarDays/><strong>Este finde</strong><span>Planes del finde</span></button></div></section>

    <section className="premium-banner"><div><Crown/><span>PREMIUM</span></div><h2>Haz que cada semana tenga algo que esperar</h2><p>Más visibilidad, recomendaciones avanzadas y acceso prioritario a experiencias seleccionadas.</p><button onClick={()=>setView('Ajustes')}>Ver CONECTA Premium <ChevronRight/></button></section>

    <section className="section home-people"><div className="section-head"><div><small>COMPATIBILIDAD</small><h2>Personas para ti</h2></div><button onClick={()=>setShowAllPeople(v=>!v)}>{showAllPeople?'Ver menos':'Ver más'} <ChevronRight/></button></div><div className="people-strip">{visiblePeople.map(person=><article key={person.name}><img loading="lazy" decoding="async" src={person.image} alt={person.name}/><div><strong>{person.name}</strong><b>{person.match} compatible</b><span>{person.tags.slice(0,2).join(' · ')}</span></div><button className={connected.has(person.name)?'is-connected':''} aria-label={connected.has(person.name)?`Cancelar conexión con ${person.name}`:`Conectar con ${person.name}`} aria-pressed={connected.has(person.name)} onClick={()=>toggleConnection(person)}>{connected.has(person.name)?<Check/>:<Plus/>}</button></article>)}</div></section>

    <section className="section escape-section"><div className="section-head"><div><small>ESCAPADAS</small><h2>Sal de la rutina</h2></div><button className="escape-view-all" onClick={()=>openExplore('weekend')}>Ver más <ChevronRight/></button></div><div className="escape-grid">{escapes.map(([title,date,image],index)=><article key={title} role="button" tabIndex={0} onClick={()=>openEscape(title,date,image,index)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')openEscape(title,date,image,index)}}><img loading="lazy" decoding="async" src={image} alt={title}/><div><strong>{title}</strong><span>{date}</span></div></article>)}</div></section>

    <section className="section home-more"><div className="section-head"><div><small>MÁS IDEAS</small><h2>Sigue descubriendo</h2></div><button onClick={()=>openExplore('all')}>Explorar <ChevronRight/></button></div><PlanCards items={plans.slice(5)} onPlan={onPlan}/></section>

    <footer className="home-footer-note" aria-label="Ventajas de CONECTA Premium"><span>CONECTA PREMIUM</span><span>Planes verificados</span><span>Gente compatible</span><span>Más seguridad</span></footer>
  </div>
}
