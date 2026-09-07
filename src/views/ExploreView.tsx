import { useMemo, useState } from 'react';
import { ChevronLeft, Heart, Info, MapPin, Plus, Search, Send, SlidersHorizontal, Star, X } from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { PlanCards } from '../components/PlanComponents';
import { categories, plans } from '../data/demoData';
import type { Plan } from '../types';

type TimeFilter='all'|'near'|'today'|'weekend';
type Person={name:string;age:number;distance:string;match:string;bio:string;job:string;tags:string[];image:string;gallery:string[]};
type Story={name:string;time:string;avatar:string;image:string;caption:string;location:string};

const socialPeople:Person[]=[
  {name:'Lucía',age:24,distance:'2 km',match:'92%',bio:'Le gusta el deporte, los planes al aire libre y la buena comida.',job:'Estudiante de Marketing',tags:['Deporte','Viajes','Música','Playa'],image:'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=88',gallery:['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=360&q=82','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=360&q=82','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=360&q=82','https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=360&q=82']},
  {name:'Carlos',age:27,distance:'3 km',match:'89%',bio:'Viajes, fotografía, café y descubrir sitios nuevos con buena compañía.',job:'Diseñador',tags:['Viajes','Fotografía','Café','Arte'],image:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=88',gallery:['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=360&q=82','https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=360&q=82','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=360&q=82','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=360&q=82']},
  {name:'Marta',age:26,distance:'4 km',match:'94%',bio:'Running, cine, música y escapadas de fin de semana.',job:'Fisioterapeuta',tags:['Running','Cine','Música','Viajes'],image:'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=88',gallery:['https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=360&q=82','https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=360&q=82','https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=360&q=82','https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=360&q=82']},
  {name:'Álex',age:25,distance:'5 km',match:'87%',bio:'Senderismo, playa, buena comida y planes espontáneos.',job:'Ingeniero',tags:['Senderismo','Playa','Comida','Deporte'],image:'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=900&q=88',gallery:['https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=360&q=82','https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=360&q=82','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=360&q=82','https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=360&q=82']},
  {name:'Sara',age:23,distance:'6 km',match:'84%',bio:'Fotografía, conciertos, viajes y tardes de café.',job:'Estudiante',tags:['Fotografía','Música','Viajes','Café'],image:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=88',gallery:['https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=360&q=82','https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=360&q=82','https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=360&q=82','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=360&q=82']}
];

const stories:Story[]=[
  {name:'Lucía',time:'2 h',avatar:socialPeople[0].image,image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=90',caption:'Atardeceres que curan 🌅',location:'Tarragona'},
  {name:'Carlos',time:'4 h',avatar:socialPeople[1].image,image:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=90',caption:'Cena improvisada con buena gente ✨',location:'Tarragona centro'},
  {name:'Marta',time:'6 h',avatar:socialPeople[2].image,image:'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=90',caption:'Un poco de running y a empezar el día 💪',location:'La Pineda'},
  {name:'Álex',time:'8 h',avatar:socialPeople[3].image,image:'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=90',caption:'Hoy tocaba desconectar aquí 🏔️',location:'La Mussara'}
];

export function ExploreView({onPlan}:{onPlan:(p:Plan)=>void}){
  const [timeFilter,setTimeFilter]=useState<TimeFilter>('near');
  const [category,setCategory]=useState<string|null>(null);
  const [searchOpen,setSearchOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [sortAsc,setSortAsc]=useState(true);
  const [peopleMode,setPeopleMode]=useState(false);
  const [personIndex,setPersonIndex]=useState(0);
  const [liked,setLiked]=useState<Set<string>>(()=>new Set());
  const [personDetail,setPersonDetail]=useState<Person|null>(null);
  const [storyIndex,setStoryIndex]=useState<number|null>(null);
  const [storyCreateOpen,setStoryCreateOpen]=useState(false);
  const [storyAdded,setStoryAdded]=useState(false);
  const [storyReply,setStoryReply]=useState('');

  const visible=useMemo(()=>{
    let list=plans.filter(p=>{
      if(category&&p.category!==category)return false;
      const q=query.trim().toLocaleLowerCase('es');
      if(q&&!`${p.title} ${p.place} ${p.category}`.toLocaleLowerCase('es').includes(q))return false;
      if(timeFilter==='today')return p.time.startsWith('Hoy');
      if(timeFilter==='weekend')return /Vie|Sáb|Dom/.test(p.time);
      return true;
    });
    if(timeFilter==='near'||sortAsc)list=[...list].sort((a,b)=>parseFloat(a.distance)-parseFloat(b.distance));
    else list=[...list].sort((a,b)=>parseFloat(b.distance)-parseFloat(a.distance));
    return list;
  },[category,query,timeFilter,sortAsc]);

  const openPerson=(index:number)=>{setPersonIndex(index);setPeopleMode(true)};
  const advancePerson=(like=false)=>{
    const person=socialPeople[personIndex];
    if(like)setLiked(prev=>{const next=new Set(prev);next.add(person.name);return next});
    setPersonIndex(i=>i+1);
  };

  if(peopleMode){
    const person=socialPeople[personIndex];
    return <div className="page explore-page people-swipe-page">
      <div className="people-swipe-head"><button aria-label="Volver a Explora" onClick={()=>{setPeopleMode(false);setPersonIndex(0)}}><ChevronLeft/></button><div className="people-swipe-title"><h1>Personas para ti</h1><p>Conoce gente afín a tus gustos</p></div><button aria-label="Filtros"><SlidersHorizontal/></button></div>
      <div className="swipe-filter-row"><button className="active">Cerca de mí</button><button>Edad</button><button>Intereses</button><button>Disponibilidad</button></div>
      {person?<><div className="swipe-card"><img src={person.image} alt={`${person.name}, ${person.age} años`}/><div className="swipe-progress">{socialPeople.map((p,i)=><span key={p.name} className={i===personIndex?'active':''}/>)}</div><div className="swipe-card-info"><div className="swipe-card-info-top"><h2>{person.name}, {person.age}<i/></h2><button className="swipe-info-button" aria-label={`Ver perfil de ${person.name}`} onClick={()=>setPersonDetail(person)}><Info/></button></div><div className="swipe-meta"><MapPin/> A {person.distance} de ti · {person.match} afinidad</div><p className="swipe-bio">{person.bio}</p><div className="swipe-tags">{person.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div></div><div className="swipe-actions"><button className="swipe-action nope" onClick={()=>advancePerson(false)}><span><X/></span>No me gusta</button><button className="swipe-action skip" onClick={()=>advancePerson(false)}><span><Star/></span>Pasa</button><button className="swipe-action like" onClick={()=>advancePerson(true)}><span><Heart fill="currentColor"/></span>Me gusta</button></div></>:<div className="swipe-empty"><strong>Ya has visto las personas de esta demo</strong><span>Vuelve a empezar para seguir probando el flujo.</span><button onClick={()=>setPersonIndex(0)}>Volver a empezar</button></div>}
      {personDetail&&<div className="person-detail-overlay" onClick={()=>setPersonDetail(null)}><article className="person-detail-card" onClick={e=>e.stopPropagation()}><div className="person-detail-hero"><img src={personDetail.image} alt={personDetail.name}/><button className="person-detail-back" aria-label="Cerrar perfil" onClick={()=>setPersonDetail(null)}><ChevronLeft/></button><div className="person-detail-title"><h2>{personDetail.name}, {personDetail.age}</h2><span>A {personDetail.distance} de ti · {personDetail.match} afinidad</span></div></div><div className="person-detail-body"><strong>{personDetail.job}</strong><p>{personDetail.bio}</p><div className="person-detail-tags">{personDetail.tags.map(tag=><span key={tag}>{tag}</span>)}</div><div className="person-mini-gallery">{personDetail.gallery.map((image,i)=><img key={image} src={image} alt={`Foto ${i+1} de ${personDetail.name}`}/>)}</div><button className="person-chat-cta">¡Habla con {personDetail.name}!</button></div></article></div>}
    </div>;
  }

  return <div className="page explore-page">
    <div className="page-title"><div><h1>Explora</h1><p>Descubre planes cerca de ti</p></div><button aria-label="Buscar planes" onClick={()=>setSearchOpen(v=>!v)}>{searchOpen?<X/>:<Search/>}</button></div>
    {searchOpen&&<div className="explore-search"><Search/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar plan, lugar o categoría" aria-label="Buscar plan, lugar o categoría"/></div>}
    <div className="filter-row"><button className={timeFilter==='near'?'active':''} onClick={()=>setTimeFilter('near')}>Cerca de mí</button><button className={timeFilter==='today'?'active':''} onClick={()=>setTimeFilter('today')}>Hoy</button><button className={timeFilter==='weekend'?'active':''} onClick={()=>setTimeFilter('weekend')}>Este finde</button><button className={timeFilter==='all'?'active':''} onClick={()=>{setTimeFilter('all');setSortAsc(v=>!v)}}>Ordenar · {sortAsc?'cerca':'lejos'}</button></div>

    <section className="explore-social-block"><div className="explore-social-head"><h2>Estados</h2><button onClick={()=>setStoryIndex(0)}>Ver todos</button></div><div className="story-strip"><button className={`story-chip story-add ${storyAdded?'is-added':''}`} onClick={()=>setStoryCreateOpen(true)}><span className="story-ring"><Plus/></span><strong>Tu estado</strong><small>{storyAdded?'Ahora':'Añadir'}</small></button>{stories.map((story,i)=><button key={story.name} className="story-chip" onClick={()=>setStoryIndex(i)}><span className="story-ring"><img src={story.avatar} alt={story.name}/></span><strong>{story.name}</strong><small>{story.time}</small></button>)}</div></section>

    <section className="explore-social-block"><div className="explore-social-head"><h2>Personas para ti</h2><button onClick={()=>openPerson(0)}>Ver más</button></div><div className="people-discovery-strip">{socialPeople.slice(0,5).map((person,i)=><article key={person.name} className="discover-person-card" role="button" tabIndex={0} onClick={()=>openPerson(i)} onKeyDown={e=>{if(e.key==='Enter')openPerson(i)}}><img src={person.image} alt={person.name}/><button className={`discover-person-heart ${liked.has(person.name)?'is-liked':''}`} aria-label={liked.has(person.name)?`Quitar me gusta a ${person.name}`:`Dar me gusta a ${person.name}`} onClick={e=>{e.stopPropagation();setLiked(prev=>{const next=new Set(prev);next.has(person.name)?next.delete(person.name):next.add(person.name);return next})}}><Heart fill={liked.has(person.name)?'currentColor':'none'}/></button><div className="discover-person-copy"><strong>{person.name}, {person.age}</strong><span>{person.match} afinidad</span><small>● A {person.distance}</small></div></article>)}</div></section>

    <div className="explore-category-title"><h2>Categorías</h2><span>Elige lo que te apetece</span></div><div className="category-grid">{categories.map(([name,image])=><button key={name} className={category===name?'active':''} onClick={()=>setCategory(v=>v===name?null:name)} aria-pressed={category===name}><img loading="lazy" decoding="async" src={image} alt={name}/><span/><b><CategoryIcon name={name}/>{name}</b></button>)}</div>
    <section className="section noframe"><div className="section-head"><h2>{category||'Recomendados'}</h2>{category&&<button onClick={()=>setCategory(null)}>Ver todos</button>}</div>{visible.length?<PlanCards items={visible} onPlan={onPlan}/>:<div className="empty-state">No hay planes que coincidan con estos filtros.</div>}</section>

    {storyIndex!==null&&<div className="story-viewer"><div className="story-stage"><img src={stories[storyIndex].image} alt={`Estado de ${stories[storyIndex].name}`}/><div className="story-progress">{stories.map((story,i)=><span key={story.name} className={i===storyIndex?'active':''}/>)}</div><div className="story-top"><img src={stories[storyIndex].avatar} alt={stories[storyIndex].name}/><div><strong>{stories[storyIndex].name}</strong><small>hace {stories[storyIndex].time}</small></div><button aria-label="Cerrar estado" onClick={()=>setStoryIndex(null)}><X/></button></div><button className="story-nav-zone prev" aria-label="Estado anterior" onClick={()=>setStoryIndex(i=>i===null?null:Math.max(0,i-1))}/><button className="story-nav-zone next" aria-label="Estado siguiente" onClick={()=>setStoryIndex(i=>i===null?null:(i+1<stories.length?i+1:null))}/><div className="story-caption">{stories[storyIndex].caption}<div className="story-location"><MapPin/>{stories[storyIndex].location}</div></div><div className="story-reply"><input value={storyReply} onChange={e=>setStoryReply(e.target.value)} placeholder="Responder..." aria-label="Responder al estado"/><button aria-label="Enviar respuesta" onClick={()=>setStoryReply('')}><Send/></button><button aria-label="Me gusta"><Heart/></button></div></div></div>}
    {storyCreateOpen&&<div className="story-create-sheet" onClick={()=>setStoryCreateOpen(false)}><div className="story-create-card" onClick={e=>e.stopPropagation()}><h3>Tu estado</h3><p>Comparte un momento con la gente de CONECTA. En esta fase mantenemos el flujo en modo demo.</p><div className="story-create-actions"><button onClick={()=>setStoryCreateOpen(false)}>Cancelar</button><button className="primary" onClick={()=>{setStoryAdded(true);setStoryCreateOpen(false)}}>Añadir estado demo</button></div></div></div>}
  </div>
}
