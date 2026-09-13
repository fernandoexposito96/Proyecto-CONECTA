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
import type { Person, Plan } from '../types';

const css=`
.explore-social-v3{padding-bottom:116px;background:linear-gradient(180deg,#fbf9ff 0%,#f7f2ff 48%,#fff 100%)}
.explore-v3-hero{padding:8px 0 18px}.explore-v3-hero small{display:block;color:#7c4df4;font-weight:950;letter-spacing:.22em;margin-bottom:5px}.explore-v3-hero h1{margin:0;color:#121a42;font-size:clamp(38px,8vw,54px);line-height:1}.explore-v3-hero p{margin:9px 0 0;color:#69718a;font-weight:700}.explore-v3-search{display:grid;grid-template-columns:24px 1fr;align-items:center;gap:10px;padding:0 16px;height:52px;border:1px solid rgba(111,76,229,.14);border-radius:20px;background:#fff;box-shadow:0 12px 28px rgba(72,46,136,.07);margin-bottom:22px}.explore-v3-search input{border:0;outline:0;background:transparent;font:inherit;color:#151c43;min-width:0}.explore-v3-section{margin:0 0 28px}.explore-v3-head{display:flex;align-items:end;justify-content:space-between;gap:14px;margin-bottom:13px}.explore-v3-head h2{margin:0;color:#151c43;font-size:28px}.explore-v3-head span,.explore-v3-head button{color:#7447f4;font-weight:850;border:0;background:transparent}
.people-add-strip{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(170px,1fr);gap:12px;overflow-x:auto;padding:2px 20px 8px 1px;scroll-snap-type:x proximity;mask-image:linear-gradient(90deg,#000 0,#000 93%,transparent)}.people-add-card{scroll-snap-align:start;display:grid;justify-items:center;gap:7px;padding:15px 12px;border:1px solid rgba(116,71,244,.12);border-radius:24px;background:rgba(255,255,255,.96);box-shadow:0 13px 30px rgba(60,42,115,.08)}.people-add-avatar{width:82px;height:82px;border-radius:50%;object-fit:cover;background:#eee9fb}.people-add-card strong{font-size:17px;color:#161d44}.people-add-card small{color:#81879a}.people-add-card button{width:100%;height:36px;border-radius:999px;border:1px solid #7a4cf4;background:#fff;color:#7143ef;font-size:14px;font-weight:850;display:flex;align-items:center;justify-content:center;gap:6px}.people-add-card button.connected{background:#7547f4;color:#fff}
.story-v3-strip{display:flex;gap:15px;overflow-x:auto;padding:2px 12px 8px 1px}.story-v3-chip{flex:0 0 74px;text-align:center;border:0;background:transparent;padding:0}.story-v3-ring{width:68px;height:68px;margin:auto;border-radius:50%;padding:3px;background:linear-gradient(135deg,#7347f4,#bd6ae8);display:grid;place-items:center}.story-v3-ring>img,.story-v3-ring>video{width:100%;height:100%;border-radius:50%;object-fit:cover;border:3px solid #fff;background:#e9e2fb}.story-v3-add .story-v3-ring{background:#fff;border:2px dashed #7b4cf4;color:#7647f4}.story-v3-chip strong{display:block;margin-top:7px;font-size:12px;color:#1e2448;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.story-v3-chip small{display:block;color:#9298a8;font-size:11px;margin-top:2px}.community-media-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.community-card{position:relative;overflow:hidden;min-height:240px;border-radius:24px;background:#171529;box-shadow:0 15px 32px rgba(44,32,88,.12)}.community-card img,.community-card video{width:100%;height:100%;position:absolute;inset:0;object-fit:cover}.community-card:after{content:"";position:absolute;inset:36% 0 0;background:linear-gradient(transparent,rgba(9,8,19,.84))}.community-copy{position:absolute;z-index:2;left:13px;right:13px;bottom:13px;color:#fff}.community-copy strong{display:block;font-size:17px;line-height:1.08}.community-copy span{display:flex;align-items:center;gap:5px;margin-top:6px;font-size:12px}.community-video-badge{position:absolute;z-index:3;right:11px;top:11px;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.92);color:#7547f4}.explore-v3-error{padding:10px 12px;border-radius:14px;background:#fff0f1;color:#a83b4b;margin-bottom:12px}
@media(max-width:430px){.explore-v3-head h2{font-size:25px}.people-add-strip{grid-auto-columns:164px}.community-card{min-height:220px}}
`;

const fallbackCommunity=[
  {id:'demo-1',url:'./assets/images/photo-1507525428034-b723cf961d3e.jpg',mediaType:'image' as const,caption:'Atardecer increíble',place:'Tarragona'},
  {id:'demo-2',url:'./assets/images/photo-1517248135467-4c7edcad34c4.jpg',mediaType:'image' as const,caption:'Noche de amigos',place:'Salou'},
  {id:'demo-3',url:'./assets/images/photo-1551632811-561732d1e306.jpg',mediaType:'image' as const,caption:'Ruta de hoy',place:'La Mussara'},
  {id:'demo-4',url:'./assets/images/photo-1519046904884-53103b34b206.jpg',mediaType:'image' as const,caption:'Tarde junto al mar',place:'Cambrils'},
];

export function ExploreView({onPlan:_onPlan,onChat}:{onPlan:(plan:Plan)=>void;extraPlans?:Plan[];initialFilter?:unknown;initialCategory?:string|null;onChat:(name:string)=>void}){
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
  const advancePerson=(like:boolean)=>{const person=peopleState.filteredPeople[personIndex];if(person&&like)peopleState.toggleLike(person);setPersonIndex(index=>index+1);};
  const sendStoryReply=()=>{const active=storyIndex===null?null:storyState.stories[storyIndex];const text=storyReply.trim();if(!active||!text)return;const current=loadStored<Record<string,string[]>>(storageKeys.chatMessages,{});saveStored(storageKeys.chatMessages,{...current,[active.name]:[...(current[active.name]||[]),text]});setStoryReply('');onChat(active.name);};

  if(mode==='grid')return <PeopleGridView people={peopleState.filteredPeople} filter={peopleState.filter} locationAllowed={peopleState.locationAllowed} privacy={peopleState.privacy} liked={peopleState.liked} onFilter={peopleState.setFilter} onOpen={openSwipe} onToggleLike={peopleState.toggleLike} onBack={()=>setMode('main')}/>;
  if(mode==='swipe')return <><PeopleSwipeView people={peopleState.filteredPeople} index={personIndex} filter={peopleState.filter} locationAllowed={peopleState.locationAllowed} privacy={peopleState.privacy} onFilter={peopleState.setFilter} onBack={()=>setMode('main')} onAdvance={advancePerson} onDetail={setPersonDetail}/>{personDetail&&<PersonDetailCard person={personDetail} privacy={peopleState.privacy} onClose={()=>setPersonDetail(null)} onChat={onChat}/>}</>;

  const activeStory=storyIndex===null?null:storyState.stories[storyIndex];
  return <div className="page explore-page explore-social-v3"><style>{css}</style>
    <div className="explore-v3-hero"><small>CONECTA</small><h1>Explora</h1><p>Descubre personas y momentos de la comunidad</p></div>
    <label className="explore-v3-search"><Search/><input value={peopleState.query} onChange={e=>peopleState.setQuery(e.target.value)} placeholder="Busca personas por nombre..." aria-label="Buscar personas por nombre"/></label>
    {(error||storyState.error)&&<div className="explore-v3-error" role="alert">{error||storyState.error}</div>}

    <section className="explore-v3-section"><div className="explore-v3-head"><h2>Personas para conectar</h2><button onClick={()=>setMode('grid')}>Ver más</button></div><div className="people-add-strip">
      {peopleState.remotePeople.map(person=><article className="people-add-card" key={person.id}>{person.avatar?<img className="people-add-avatar" src={person.avatar} alt={person.name}/>:<div className="people-add-avatar"/>}<strong>{person.name}</strong><small>{person.city||person.username||'CONECTA'}</small><button className={peopleState.connected.has(person.id)?'connected':''} disabled={peopleState.connected.has(person.id)} onClick={()=>{setError('');void peopleState.addRemotePerson(person).catch(e=>setError(e instanceof Error?e.message:'No se ha podido añadir.'))}}>{peopleState.connected.has(person.id)?<><Check/>Añadido</>:<><UserPlus/>Añadir</>}</button></article>)}
      {!peopleState.remotePeople.length&&peopleState.filteredPeople.slice(0,8).map(person=><article className="people-add-card" key={person.name}><img className="people-add-avatar" src={person.image} alt={person.name}/><strong>{person.name}, {person.age}</strong><small><MapPin size={14}/> {distanceCopy(person.distance,peopleState.privacy)}</small><button className={peopleState.connected.has(person.name)?'connected':''} disabled={peopleState.connected.has(person.name)} onClick={()=>{void peopleState.addPerson(person)}}>{peopleState.connected.has(person.name)?<><Check/>Añadido</>:<><UserPlus/>Añadir</>}</button></article>)}
    </div></section>

    <section className="explore-v3-section"><div className="explore-v3-head"><h2>Estados</h2><button onClick={()=>setStoryCreateOpen(true)}>{storyState.uploading?'Subiendo…':'Subir estado'}</button></div><div className="story-v3-strip">
      <button className="story-v3-chip story-v3-add" onClick={()=>setStoryCreateOpen(true)}><span className="story-v3-ring"><Plus/></span><strong>Subir estado</strong><small>Foto o vídeo</small></button>
      {storyState.stories.slice(0,7).map((story,index)=><button className="story-v3-chip" key={story.key} onClick={()=>setStoryIndex(index)}><span className="story-v3-ring">{story.mediaType==='video'?<video src={story.image} muted playsInline/>:<img src={story.avatar||story.image} alt={story.name}/>}</span><strong>{story.name}</strong><small>{story.time}</small></button>)}
    </div></section>

    <section className="explore-v3-section"><div className="explore-v3-head"><h2>Novedades de la comunidad</h2><span>Fotos y vídeos</span></div><div className="community-media-grid">{community.map(item=><article className="community-card" key={item.id}>{item.mediaType==='video'?<><video src={item.url} controls playsInline preload="metadata"/><span className="community-video-badge"><Video size={18}/></span></>:<><img src={item.url} alt={item.caption}/><span className="community-video-badge"><Camera size={18}/></span></>}<div className="community-copy"><strong>{item.caption}</strong><span><MapPin size={14}/>{item.place}</span></div></article>)}</div></section>

    <StoryCreateSheet open={storyCreateOpen} inputRef={storyState.inputRef} uploading={storyState.uploading} onClose={()=>setStoryCreateOpen(false)} onUpload={file=>{void storyState.upload(file).then(()=>setStoryCreateOpen(false))}}/>
    {activeStory&&<StoryViewer story={activeStory} liked={storyState.storyLikes.has(activeStory.key)} reply={storyReply} onReply={setStoryReply} onLike={()=>storyState.toggleLike(activeStory.key)} onSend={sendStoryReply} onClose={()=>setStoryIndex(null)}/>} 
  </div>;
}
