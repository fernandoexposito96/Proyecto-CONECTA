import { useEffect, useMemo, useState } from 'react';
import { Camera, Check, MapPin, Plus, Search, UserPlus, Video } from 'lucide-react';
import { PersonDetailCard } from '../components/explore/PersonDetailCard';
import { PeopleGridView } from '../components/explore/PeopleGridView';
import { PeopleSwipeView } from '../components/explore/PeopleSwipeView';
import { StoryCreateSheet } from '../components/explore/StoryCreateSheet';
import { StoryViewer } from '../components/explore/StoryViewer';
import { useExplorePeople } from '../hooks/useExplorePeople';
import { useExploreStories } from '../hooks/useExploreStories';
import { distanceCopy } from '../lib/privacy';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import type { ExploreFilter, Person, Plan } from '../types';

const fallbackCommunity=[
  {id:'demo-1',url:'./assets/images/photo-1507525428034-b723cf961d3e.jpg',mediaType:'image' as const,caption:'Atardecer increíble',place:'Tarragona'},
  {id:'demo-2',url:'./assets/images/photo-1517248135467-4c7edcad34c4.jpg',mediaType:'image' as const,caption:'Noche de amigos',place:'Salou'},
  {id:'demo-3',url:'./assets/images/photo-1551632811-561732d1e306.jpg',mediaType:'image' as const,caption:'Ruta de hoy',place:'La Mussara'},
  {id:'demo-4',url:'./assets/images/photo-1519046904884-53103b34b206.jpg',mediaType:'image' as const,caption:'Tarde junto al mar',place:'Cambrils'},
];

export function ExploreView({onChat}:{onPlan:(plan:Plan)=>void;extraPlans?:Plan[];initialFilter?:ExploreFilter;initialCategory?:string|null;onChat:(name:string)=>void}){
  const peopleState=useExplorePeople();
  const storyState=useExploreStories();
  const [mode,setMode]=useState<'main'|'grid'|'swipe'>('main');
  const [personIndex,setPersonIndex]=useState(0);
  const [personDetail,setPersonDetail]=useState<Person|null>(null);
  const [storyIndex,setStoryIndex]=useState<number|null>(null);
  const [storyCreateOpen,setStoryCreateOpen]=useState(false);
  const [storyReply,setStoryReply]=useState('');
  const [error,setError]=useState('');
  useEffect(()=>{void storyState.refresh()},[]);
  const community=useMemo(()=>[...storyState.media.slice(0,6).map(item=>({id:item.id,url:item.url,mediaType:item.mediaType,caption:item.caption||'Tu nuevo estado',place:'Tu perfil'})),...fallbackCommunity].slice(0,8),[storyState.media]);
  const openSwipe=(person:Person)=>{const index=peopleState.filteredPeople.findIndex(item=>item.name===person.name);setPersonIndex(Math.max(0,index));setMode('swipe');};
  const advancePerson=(action:'like'|'dislike'|'skip')=>{
    const person=peopleState.filteredPeople[personIndex];
    if(person){
      if(action==='like')peopleState.toggleLike(person);
      if(action==='dislike')peopleState.dislikePerson(person);
    }
    setPersonIndex(index=>index+1);
  };
  const sendStoryReply=()=>{const active=storyIndex===null?null:storyState.stories[storyIndex];const text=storyReply.trim();if(!active||!text)return;const current=loadStored<Record<string,string[]>>(storageKeys.chatMessages,{});saveStored(storageKeys.chatMessages,{...current,[active.name]:[...(current[active.name]||[]),text]});setStoryReply('');onChat(active.name);};
  if(mode==='grid')return <PeopleGridView people={peopleState.filteredPeople} filter={peopleState.filter} locationAllowed={peopleState.locationAllowed} privacy={peopleState.privacy} liked={peopleState.liked} onFilter={peopleState.setFilter} onOpen={openSwipe} onToggleLike={peopleState.toggleLike} onBack={()=>setMode('main')}/>;
  if(mode==='swipe')return <><PeopleSwipeView people={peopleState.filteredPeople} index={personIndex} filter={peopleState.filter} locationAllowed={peopleState.locationAllowed} privacy={peopleState.privacy} onFilter={peopleState.setFilter} onBack={()=>setMode('main')} onAdvance={advancePerson} onDetail={setPersonDetail}/>{personDetail&&<PersonDetailCard person={personDetail} privacy={peopleState.privacy} onClose={()=>setPersonDetail(null)} onChat={onChat}/>}</>;
  const activeStory=storyIndex===null?null:storyState.stories[storyIndex];
  return <div className="page explore-page explore-social-v3">
    <div className="explore-v3-hero"><small>CONECTA</small><h1>Explora</h1><p>Descubre personas, planes y momentos de la comunidad</p></div>
    <label className="explore-v3-search"><Search/><input value={peopleState.query} onChange={e=>peopleState.setQuery(e.target.value)} placeholder="Busca personas por nombre..." aria-label="Buscar personas por nombre"/></label>
    {(error||storyState.error)&&<div className="explore-v3-error" role="alert">{error||storyState.error}</div>}
    <section className="explore-v3-section"><div className="explore-v3-head"><h2>Personas para conectar</h2><button onClick={()=>setMode('grid')}>Ver más</button></div><div className="people-add-strip">
      {peopleState.remotePeople.map(person=><article className="people-add-card" key={person.id}>{person.avatar?<img className="people-add-avatar" src={person.avatar} alt={person.name}/>:<div className="people-add-avatar"/>}<strong>{person.name}</strong><small>{person.city||person.username||'CONECTA'}</small><button className={peopleState.connected.has(person.id)?'connected':''} disabled={peopleState.connected.has(person.id)} onClick={()=>{setError('');void peopleState.addRemotePerson(person).catch(e=>setError(e instanceof Error?e.message:'No se ha podido añadir.'))}}>{peopleState.connected.has(person.id)?<><Check/>Añadido</>:<><UserPlus/>Añadir</>}</button></article>)}
      {!peopleState.remotePeople.length&&peopleState.filteredPeople.slice(0,8).map(person=><article className="people-add-card" key={person.name}><img className="people-add-avatar" src={person.image} alt={person.name}/><strong>{person.name}, {person.age}</strong><small><MapPin size={14}/> {distanceCopy(person.distance,peopleState.privacy)}</small><button className={peopleState.connected.has(person.name)?'connected':''} disabled={peopleState.connected.has(person.name)} onClick={()=>{void peopleState.addPerson(person)}}>{peopleState.connected.has(person.name)?<><Check/>Añadido</>:<><UserPlus/>Añadir</>}</button></article>)}
    </div></section>
    <section className="explore-v3-section"><div className="explore-v3-head"><h2>Estados</h2><button onClick={()=>setStoryCreateOpen(true)}>{storyState.uploading?'Subiendo…':'Subir estado'}</button></div><div className="story-v3-strip">
      <button className="story-v3-chip story-v3-add" onClick={()=>setStoryCreateOpen(true)}><span className="story-v3-ring"><Plus/></span><strong>Subir estado</strong><small>Foto o vídeo</small></button>
      {storyState.stories.slice(0,3).map((story,index)=><button className="story-v3-chip" key={story.key} onClick={()=>setStoryIndex(index)}><span className="story-v3-ring">{story.mediaType==='video'?<video src={story.image} muted playsInline/>:<img src={story.avatar||story.image} alt={story.name}/>}</span><strong>{story.name}</strong><small>{story.time}</small></button>)}
    </div></section>
    <section className="explore-v3-section"><div className="explore-v3-head"><h2>Novedades de la comunidad</h2><span>Fotos y vídeos</span></div><div className="community-media-grid">{community.map(item=><article className="community-card" key={item.id}>{item.mediaType==='video'?<><video src={item.url} controls playsInline preload="metadata"/><span className="community-video-badge"><Video size={18}/></span></>:<><img src={item.url} alt={item.caption}/><span className="community-video-badge"><Camera size={18}/></span></>}<div className="community-copy"><strong>{item.caption}</strong><span><MapPin size={14}/>{item.place}</span></div></article>)}</div></section>
    <StoryCreateSheet open={storyCreateOpen} inputRef={storyState.inputRef} uploading={storyState.uploading} onClose={()=>setStoryCreateOpen(false)} onUpload={file=>{void storyState.upload(file).then(()=>setStoryCreateOpen(false))}}/>
    {activeStory&&<StoryViewer story={activeStory} liked={storyState.storyLikes.has(activeStory.key)} reply={storyReply} onReply={setStoryReply} onLike={()=>storyState.toggleLike(activeStory.key)} onSend={sendStoryReply} onClose={()=>setStoryIndex(null)}/>} 
  </div>;
}
