import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Heart, Info, MapPin, Plus, Search, Send, SlidersHorizontal, Star, UserX, X } from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { PlanCards } from '../components/PlanComponents';
import { categories, people, plans } from '../data/demoData';
import { filterExplorePlans } from '../lib/planLogic';
import { blockedNames, canUseLocation, distanceCopy, loadBlockedUsers, loadPrivacySettings } from '../lib/privacy';
import { addBackendBlock, isRealUserId } from '../lib/privacyBackend';
import { removeBackendConnection, requestBackendConnection } from '../lib/socialBackend';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import type { ExploreFilter, PeopleFilter, Person, Plan, Story } from '../types';

const socialPeopleBase=people.filter(person=>['Lucía','Carlos','Marta','Álex','Sara'].includes(person.name));

const storyCatalog:Story[]=[
  {name:'Lucía',time:'2 h',avatar:socialPeopleBase.find(person=>person.name==='Lucía')?.image||'',image:'./assets/images/photo-1507525428034-b723cf961d3e.jpg',caption:'Atardeceres que curan 🌅',location:'Tarragona'},
  {name:'Carlos',time:'4 h',avatar:socialPeopleBase.find(person=>person.name==='Carlos')?.image||'',image:'./assets/images/photo-1517248135467-4c7edcad34c4.jpg',caption:'Cena improvisada con buena gente ✨',location:'Tarragona centro'},
  {name:'Marta',time:'6 h',avatar:socialPeopleBase.find(person=>person.name==='Marta')?.image||'',image:'./assets/images/photo-1552674605-db6ffd4facb5.jpg',caption:'Un poco de running y a empezar el día 💪',location:'La Pineda'},
  {name:'Álex',time:'8 h',avatar:socialPeopleBase.find(person=>person.name==='Álex')?.image||'',image:'./assets/images/photo-1551632811-561732d1e306.jpg',caption:'Hoy tocaba desconectar aquí 🏔️',location:'La Mussara'}
];

const demoUserId=(name:string)=>`demo-${name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g,'-')}`;

export function ExploreView({onPlan,extraPlans=[],initialFilter='near',initialCategory=null,onChat}:{onPlan:(p:Plan)=>void,extraPlans?:Plan[],initialFilter?:ExploreFilter,initialCategory?:string|null,onChat:(name:string)=>void}){
  const [privacy]=useState(loadPrivacySettings);
  const [blocked,setBlocked]=useState<Set<string>>(()=>blockedNames());
  const locationAllowed=canUseLocation(privacy);
  const socialPeople=useMemo(()=>socialPeopleBase.filter(person=>!blocked.has(person.name)),[blocked]);
  const stories=useMemo(()=>storyCatalog.filter(story=>!blocked.has(story.name)),[blocked]);
  const [timeFilter,setTimeFilter]=useState<ExploreFilter>(()=>initialFilter==='near'&&!locationAllowed?'all':initialFilter);
  const [category,setCategory]=useState<string|null>(initialCategory);
  const [searchOpen,setSearchOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [sortAsc,setSortAsc]=useState(true);
  const [peopleGridOpen,setPeopleGridOpen]=useState(false);
  const [peopleMode,setPeopleMode]=useState(false);
  const [peopleFilter,setPeopleFilter]=useState<PeopleFilter>(()=>locationAllowed?'near':'match');
  const [personIndex,setPersonIndex]=useState(0);
  const [liked,setLiked]=useState<Set<string>>(()=>new Set(loadStored<string[]>(storageKeys.exploreLikes,[])));
  const [personDetail,setPersonDetail]=useState<Person|null>(null);
  const [storyIndex,setStoryIndex]=useState<number|null>(null);
  const [storyCreateOpen,setStoryCreateOpen]=useState(false);
  const [storyAdded,setStoryAdded]=useState(()=>loadStored<boolean>(storageKeys.storyAdded,false));
  const [storyLikes,setStoryLikes]=useState<Set<string>>(()=>new Set(loadStored<string[]>(storageKeys.storyLikes,[])));
  const [storyReply,setStoryReply]=useState('');

  useEffect(()=>{setTimeFilter(initialFilter==='near'&&!locationAllowed?'all':initialFilter)},[initialFilter,locationAllowed]);
  useEffect(()=>{setCategory(initialCategory)},[initialCategory]);
  useEffect(()=>{saveStored(storageKeys.exploreLikes,[...liked])},[liked]);
  useEffect(()=>{saveStored(storageKeys.storyAdded,storyAdded)},[storyAdded]);
  useEffect(()=>{saveStored(storageKeys.storyLikes,[...storyLikes])},[storyLikes]);

  const allPlans=useMemo(()=>[...extraPlans,...plans],[extraPlans]);
  const visible=useMemo(()=>filterExplorePlans(allPlans,{timeFilter,category,query,sortAsc}),[allPlans,category,query,timeFilter,sortAsc]);

  const gridPeople=useMemo(()=>{
    const list=[...socialPeople];
    if(peopleFilter==='match'||(peopleFilter==='near'&&!locationAllowed))return list.sort((a,b)=>parseInt(b.match)-parseInt(a.match));
    if(peopleFilter==='age')return list.sort((a,b)=>a.age-b.age);
    if(peopleFilter==='interests')return list.sort((a,b)=>b.tags.length-a.tags.length);
    return list.sort((a,b)=>parseFloat(a.distance)-parseFloat(b.distance));
  },[peopleFilter,socialPeople,locationAllowed]);

  const likePerson=(person:Person)=>{
    if(liked.has(person.name))return;
    setLiked(prev=>{const next=new Set(prev);next.add(person.name);return next});
    if(person.userId&&isRealUserId(person.userId)){
      void requestBackendConnection(person.userId).catch(error=>console.warn('CONECTA connection request failed; local like kept',error));
    }
  };
  const toggleLike=(person:Person)=>{
    if(liked.has(person.name)){
      setLiked(prev=>{const next=new Set(prev);next.delete(person.name);return next});
      if(person.userId&&isRealUserId(person.userId)){
        void removeBackendConnection(person.userId).catch(error=>console.warn('CONECTA connection removal failed; local like kept',error));
      }
      return;
    }
    likePerson(person);
  };
  const toggleStoryLike=(name:string)=>setStoryLikes(prev=>{const next=new Set(prev);next.has(name)?next.delete(name):next.add(name);return next});
  const cyclePeopleFilter=()=>setPeopleFilter(current=>{
    const sequence:PeopleFilter[]=locationAllowed?['near','age','interests','match']:['match','age','interests'];
    const index=sequence.indexOf(current);
    return sequence[(index+1)%sequence.length];
  });
  const openPerson=(index:number)=>{if(index<0)return;setPersonIndex(index);setPeopleMode(true)};
  const advancePerson=(like=false)=>{
    const person=socialPeople[personIndex];
    if(!person)return;
    if(like)likePerson(person);
    setPersonIndex(i=>i+1);
  };
  const blockPerson=(person:Person)=>{
    const current=loadBlockedUsers();
    const userId=person.userId&&isRealUserId(person.userId)?person.userId:demoUserId(person.name);
    if(!current.some(user=>user.userId===userId||user.name===person.name)){
      saveStored(storageKeys.blockedUsers,[...current,{userId,name:person.name,avatar:person.image}]);
    }
    setBlocked(previous=>new Set(previous).add(person.name));
    setLiked(previous=>{const next=new Set(previous);next.delete(person.name);return next});
    if(person.userId&&isRealUserId(person.userId)){
      void addBackendBlock(person.userId).catch(error=>console.warn('CONECTA backend block failed; local block kept',error));
      void removeBackendConnection(person.userId).catch(error=>console.warn('CONECTA connection removal after block failed',error));
    }
    setPersonDetail(null);
  };
  const sendStoryReply=()=>{
    const text=storyReply.trim();
    if(!text||storyIndex===null)return;
    const story=stories[storyIndex];
    if(!story||blocked.has(story.name))return;
    const name=story.name;
    const current=loadStored<Record<string,string[]>>(storageKeys.chatMessages,{});
    saveStored(storageKeys.chatMessages,{...current,[name]:[...(current[name]||[]),text]});
    setStoryReply('');
    onChat(name);
  };

  if(peopleMode){
    const person=socialPeople[personIndex];
    return <div className="page explore-page people-swipe-page">
      <div className="people-swipe-head"><button aria-label="Volver a Personas para ti" onClick={()=>{setPeopleMode(false);setPersonIndex(0);setPersonDetail(null)}}><ChevronLeft/></button><div className="people-swipe-title"><h1>Personas para ti</h1><p>Desliza para conocer gente afín</p></div><button aria-label="Cambiar filtro de personas" onClick={cyclePeopleFilter}><SlidersHorizontal/></button></div>
      <div className="swipe-filter-row"><button disabled={!locationAllowed} className={peopleFilter==='near'?'active':''} onClick={()=>setPeopleFilter('near')}>Cerca de mí</button><button className={peopleFilter==='age'?'active':''} onClick={()=>setPeopleFilter('age')}>Edad</button><button className={peopleFilter==='interests'?'active':''} onClick={()=>setPeopleFilter('interests')}>Intereses</button><button className={peopleFilter==='match'?'active':''} onClick={()=>setPeopleFilter('match')}>Afinidad</button></div>
      {person?<><div className="swipe-card"><img src={person.image} alt={`${person.name}, ${person.age} años`}/><div className="swipe-progress">{socialPeople.map((p,i)=><span key={p.name} className={i===personIndex?'active':''}/>)}</div><div className="swipe-card-info"><div className="swipe-card-info-top"><h2>{person.name}, {person.age}<i/></h2><button className="swipe-info-button" aria-label={`Ver perfil de ${person.name}`} onClick={()=>setPersonDetail(person)}><Info/></button></div><div className="swipe-meta"><MapPin/> {distanceCopy(person.distance,privacy)} · {person.match} afinidad</div><p className="swipe-bio">{person.bio}</p><div className="swipe-tags">{person.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div></div><div className="swipe-actions"><button className="swipe-action nope" onClick={()=>advancePerson(false)}><span><X/></span>No me gusta</button><button className="swipe-action skip" onClick={()=>advancePerson(false)}><span><Star/></span>Pasa</button><button className="swipe-action like" onClick={()=>advancePerson(true)}><span><Heart fill="currentColor"/></span>Me gusta</button></div></>:<div className="swipe-empty"><strong>Ya has visto las personas disponibles</strong><span>Vuelve a empezar para seguir probando el flujo.</span><button onClick={()=>setPersonIndex(0)}>Volver a empezar</button></div>}
      {personDetail&&<div className="person-detail-overlay" onClick={()=>setPersonDetail(null)}><article className="person-detail-card" onClick={e=>e.stopPropagation()}><div className="person-detail-hero"><img src={personDetail.image} alt={personDetail.name}/><button className="person-detail-back" aria-label="Cerrar perfil" onClick={()=>setPersonDetail(null)}><ChevronLeft/></button><div className="person-detail-title"><h2>{personDetail.name}, {personDetail.age}</h2><span>{distanceCopy(personDetail.distance,privacy)} · {personDetail.match} afinidad</span></div></div><div className="person-detail-body"><strong>{personDetail.job}</strong><p>{personDetail.bio}</p><div className="person-detail-tags">{personDetail.tags.map(tag=><span key={tag}>{tag}</span>)}</div><div className="person-mini-gallery">{personDetail.gallery.map((image,i)=><img key={image} src={image} alt={`Foto ${i+1} de ${personDetail.name}`}/>)}</div><button className="person-chat-cta" onClick={()=>onChat(personDetail.name)}>Hablar con {personDetail.name}</button><button className="settings-danger-cta" onClick={()=>blockPerson(personDetail)}><UserX/><span><strong>Bloquear a {personDetail.name}</strong><small>Dejará de aparecer en Explorar y Chat.</small></span></button></div></article></div>}
    </div>;
  }

  if(peopleGridOpen){
    return <div className="page explore-page people-grid-page">
      <div className="people-swipe-head"><button aria-label="Volver a Explora" onClick={()=>setPeopleGridOpen(false)}><ChevronLeft/></button><div className="people-swipe-title"><h1>Personas para ti</h1><p>Conoce gente afín a tus gustos</p></div><button aria-label="Cambiar filtro de personas" onClick={cyclePeopleFilter}><SlidersHorizontal/></button></div>
      <div className="swipe-filter-row people-grid-filters"><button disabled={!locationAllowed} className={peopleFilter==='near'?'active':''} onClick={()=>setPeopleFilter('near')}>Cerca de mí</button><button className={peopleFilter==='age'?'active':''} onClick={()=>setPeopleFilter('age')}>Edad</button><button className={peopleFilter==='interests'?'active':''} onClick={()=>setPeopleFilter('interests')}>Intereses</button><button className={peopleFilter==='match'?'active':''} onClick={()=>setPeopleFilter('match')}>Afinidad</button></div>
      <div className="people-browser-grid">{gridPeople.map(person=>{const index=socialPeople.findIndex(p=>p.name===person.name);return <article key={person.name} className="people-browser-card" role="button" tabIndex={0} onClick={()=>openPerson(index)} onKeyDown={e=>{if(e.key==='Enter')openPerson(index)}}><div className="people-browser-photo"><img src={person.image} alt={`${person.name}, ${person.age} años`}/><button className={liked.has(person.name)?'is-liked':''} aria-label={liked.has(person.name)?`Quitar me gusta a ${person.name}`:`Dar me gusta a ${person.name}`} onClick={e=>{e.stopPropagation();toggleLike(person)}}><Heart fill={liked.has(person.name)?'currentColor':'none'}/></button></div><div className="people-browser-copy"><strong>{person.name}, {person.age}</strong><span><MapPin/> {distanceCopy(person.distance,privacy)}</span><p>{person.tags.slice(0,3).join(', ')}</p><small>{person.match} afinidad</small></div></article>})}</div>
    </div>;
  }

  const activeStory=storyIndex===null?null:stories[storyIndex];
  return <div className="page explore-page">
    <div className="page-title"><div><h1>Explora</h1><p>{locationAllowed?'Descubre planes cerca de ti':'Descubre planes y actividades'}</p></div><button aria-label="Buscar planes" onClick={()=>setSearchOpen(v=>!v)}>{searchOpen?<X/>:<Search/>}</button></div>
    {searchOpen&&<div className="explore-search"><Search/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar plan, lugar o categoría" aria-label="Buscar plan, lugar o categoría"/></div>}
    <div className="filter-row"><button disabled={!locationAllowed} className={timeFilter==='near'?'active':''} onClick={()=>setTimeFilter('near')}>Cerca de mí</button><button className={timeFilter==='today'?'active':''} onClick={()=>setTimeFilter('today')}>Hoy</button><button className={timeFilter==='afternoon'?'active':''} onClick={()=>setTimeFilter('afternoon')}>Esta tarde</button><button className={timeFilter==='tonight'?'active':''} onClick={()=>setTimeFilter('tonight')}>Esta noche</button><button className={timeFilter==='weekend'?'active':''} onClick={()=>setTimeFilter('weekend')}>Este finde</button><button className={timeFilter==='all'?'active':''} onClick={()=>{setTimeFilter('all');setSortAsc(v=>!v)}}>Ordenar · {sortAsc?'cerca':'lejos'}</button></div>

    <section className="explore-social-block"><div className="explore-social-head"><h2>Estados</h2><button disabled={!stories.length} onClick={()=>setStoryIndex(0)}>Ver todos</button></div><div className="story-strip"><button className={`story-chip story-add ${storyAdded?'is-added':''}`} onClick={()=>setStoryCreateOpen(true)}><span className="story-ring"><Plus/></span><strong>Tu estado</strong><small>{storyAdded?'Ahora':'Añadir'}</small></button>{stories.map((story,i)=><button key={story.name} className="story-chip" onClick={()=>setStoryIndex(i)}><span className="story-ring"><img src={story.avatar} alt={story.name}/></span><strong>{story.name}</strong><small>{story.time}</small></button>)}</div></section>

    <section className="explore-social-block"><div className="explore-social-head"><h2>Personas para ti</h2><button disabled={!socialPeople.length} onClick={()=>setPeopleGridOpen(true)}>Ver más</button></div>{socialPeople.length?<div className="people-discovery-strip">{socialPeople.slice(0,5).map((person,i)=><article key={person.name} className="discover-person-card" role="button" tabIndex={0} onClick={()=>openPerson(i)} onKeyDown={e=>{if(e.key==='Enter')openPerson(i)}}><img src={person.image} alt={person.name}/><button className={`discover-person-heart ${liked.has(person.name)?'is-liked':''}`} aria-label={liked.has(person.name)?`Quitar me gusta a ${person.name}`:`Dar me gusta a ${person.name}`} onClick={e=>{e.stopPropagation();toggleLike(person)}}><Heart fill={liked.has(person.name)?'currentColor':'none'}/></button><div className="discover-person-copy"><strong>{person.name}, {person.age}</strong><span>{person.match} afinidad</span><small>● {distanceCopy(person.distance,privacy)}</small></div></article>)}</div>:<div className="empty-state">No hay personas disponibles con tus filtros de privacidad actuales.</div>}</section>

    <div className="explore-category-title"><h2>Categorías</h2><span>Elige lo que te apetece</span></div><div className="category-grid">{categories.map(([name,image])=><button key={name} className={category===name?'active':''} onClick={()=>setCategory(v=>v===name?null:name)} aria-pressed={category===name}><img loading="lazy" decoding="async" src={image} alt={name}/><span/><b><CategoryIcon name={name}/>{name}</b></button>)}</div>
    <section className="section noframe"><div className="section-head"><h2>{category||'Recomendados'}</h2>{category&&<button onClick={()=>setCategory(null)}>Ver todos</button>}</div>{visible.length?<PlanCards items={visible} onPlan={onPlan}/>:<div className="empty-state">No hay planes que coincidan con estos filtros.</div>}</section>

    {activeStory&&storyIndex!==null&&<div className="story-viewer"><div className="story-stage"><img src={activeStory.image} alt={`Estado de ${activeStory.name}`}/><div className="story-progress">{stories.map((story,i)=><span key={story.name} className={i===storyIndex?'active':''}/>)}</div><div className="story-top"><img src={activeStory.avatar} alt={activeStory.name}/><div><strong>{activeStory.name}</strong><small>hace {activeStory.time}</small></div><button aria-label="Cerrar estado" onClick={()=>setStoryIndex(null)}><X/></button></div><button className="story-nav-zone prev" aria-label="Estado anterior" onClick={()=>setStoryIndex(i=>i===null?null:Math.max(0,i-1))}/><button className="story-nav-zone next" aria-label="Estado siguiente" onClick={()=>setStoryIndex(i=>i===null?null:(i+1<stories.length?i+1:null))}/><div className="story-caption">{activeStory.caption}<div className="story-location"><MapPin/>{activeStory.location}</div></div><div className="story-reply"><input value={storyReply} onChange={e=>setStoryReply(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')sendStoryReply()}} placeholder="Responder..." aria-label="Responder al estado"/><button aria-label="Enviar respuesta" onClick={sendStoryReply}><Send/></button><button aria-label={storyLikes.has(activeStory.name)?'Quitar me gusta':'Me gusta'} aria-pressed={storyLikes.has(activeStory.name)} onClick={()=>toggleStoryLike(activeStory.name)}><Heart fill={storyLikes.has(activeStory.name)?'currentColor':'none'}/></button></div></div></div>}
    {storyCreateOpen&&<div className="story-create-sheet" onClick={()=>setStoryCreateOpen(false)}><div className="story-create-card" onClick={e=>e.stopPropagation()}><h3>Tu estado</h3><p>Comparte un momento con la gente de CONECTA. El estado se conserva en este dispositivo.</p><div className="story-create-actions"><button onClick={()=>setStoryCreateOpen(false)}>Cancelar</button><button className="primary" onClick={()=>{setStoryAdded(true);setStoryCreateOpen(false)}}>Añadir estado</button></div></div></div>}
  </div>
}
