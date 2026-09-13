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

const css=`
.explore-social-v3{padding-bottom:calc(150px + env(safe-area-inset-bottom,0px));background:
radial-gradient(circle at 82% 3%,rgba(126,88,255,.13),transparent 22%),
radial-gradient(circle at 8% 48%,rgba(201,161,255,.10),transparent 24%),
linear-gradient(180deg,#fcfbff 0%,#f8f4ff 46%,#fff 100%)}
.explore-v3-hero{padding:10px 0 20px;position:relative}
.explore-v3-hero small{display:block;color:#7648f4;font-weight:950;letter-spacing:.24em;margin-bottom:6px;text-shadow:0 6px 20px rgba(118,72,244,.16)}
.explore-v3-hero h1{margin:0;color:#10183d;font-size:clamp(40px,8vw,56px);line-height:.98;letter-spacing:-.045em}
.explore-v3-hero p{margin:10px 0 0;color:#68718b;font-weight:750;max-width:520px}
.explore-v3-search{display:grid;grid-template-columns:24px 1fr;align-items:center;gap:11px;padding:0 17px;height:56px;border:1px solid rgba(112,72,244,.14);border-radius:22px;background:rgba(255,255,255,.88);box-shadow:0 14px 34px rgba(69,43,139,.10),inset 0 1px 0 rgba(255,255,255,.9);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);margin-bottom:24px}
.explore-v3-search svg{color:#253058}
.explore-v3-search input{border:0;outline:0;background:transparent;font:inherit;color:#151c43;min-width:0}
.explore-v3-section{margin:0 0 32px}
.explore-v3-head{display:flex;align-items:end;justify-content:space-between;gap:14px;margin-bottom:14px}
.explore-v3-head h2{margin:0;color:#121a42;font-size:28px;letter-spacing:-.035em}
.explore-v3-head span,.explore-v3-head button{color:#7447f4;font-weight:900;border:0;background:transparent;text-shadow:0 5px 18px rgba(116,71,244,.12)}
.people-add-strip{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(152px,41%);gap:12px;overflow-x:auto;overflow-y:hidden;padding:4px 54px 12px 2px;scroll-snap-type:x mandatory;scroll-padding-inline:2px 54px;overscroll-behavior-inline:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.people-add-strip::-webkit-scrollbar{display:none}
.people-add-card{scroll-snap-align:start;scroll-snap-stop:always;display:grid;justify-items:center;gap:8px;padding:16px 12px 14px;border:1px solid rgba(121,80,246,.13);border-radius:26px;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(251,249,255,.95));box-shadow:0 16px 38px rgba(55,37,112,.11),0 2px 8px rgba(86,58,169,.05),inset 0 1px 0 #fff;min-width:0}
.people-add-avatar{width:86px;height:86px;border-radius:50%;object-fit:cover;background:#eee9fb;box-shadow:0 0 0 4px #fff,0 0 0 6px rgba(120,73,244,.12),0 10px 24px rgba(58,38,116,.14)}
.people-add-card strong{font-size:18px;color:#151d46;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.025em}
.people-add-card small{color:#81879a;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;justify-content:center;gap:4px}
.people-add-card button{width:100%;height:38px;border-radius:999px;border:1.5px solid #7a4cf4;background:rgba(255,255,255,.94);color:#7143ef;font-size:14px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 7px 18px rgba(118,71,244,.08);transition:transform .18s ease,box-shadow .18s ease}
.people-add-card button:active{transform:scale(.98)}
.people-add-card button.connected{border-color:transparent;background:linear-gradient(135deg,#7146f4,#8d5bff);color:#fff;box-shadow:0 10px 24px rgba(116,71,244,.24)}
.story-v3-strip{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;column-gap:10px!important;align-items:start!important;overflow:visible!important;padding:4px 0 10px!important;min-height:120px!important}
.story-v3-chip{appearance:none!important;border:0!important;background:transparent!important;padding:0!important;min-width:0!important;width:100%!important;display:grid!important;grid-template-rows:72px auto auto!important;justify-items:center!important;align-items:start!important;text-align:center!important;color:inherit!important;font:inherit!important}
.story-v3-ring{display:grid!important;place-items:center!important;position:relative!important;width:72px!important;height:72px!important;min-width:72px!important;min-height:72px!important;max-width:72px!important;max-height:72px!important;aspect-ratio:1/1!important;margin:0 auto!important;border-radius:50%!important;padding:3px!important;box-sizing:border-box!important;overflow:hidden!important;background:linear-gradient(135deg,#6d42f3,#9d5bf5 60%,#d070ef)!important;box-shadow:0 8px 20px rgba(116,71,244,.18)}
.story-v3-ring>img,.story-v3-ring>video{position:absolute!important;inset:3px!important;width:calc(100% - 6px)!important;height:calc(100% - 6px)!important;max-width:none!important;max-height:none!important;margin:0!important;border-radius:50%!important;object-fit:cover!important;object-position:center!important;border:3px solid #fff!important;background:#e9e2fb!important;box-sizing:border-box!important}
.story-v3-add .story-v3-ring{padding:0!important;background:linear-gradient(145deg,#fff,#f3edff)!important;border:2px dashed #7b4cf4!important;color:#7647f4!important;box-shadow:0 8px 22px rgba(116,71,244,.12)}
.story-v3-add .story-v3-ring svg{width:30px;height:30px}
.story-v3-chip strong{position:static!important;display:block!important;width:72px!important;max-width:72px!important;margin:8px 0 0!important;padding:0!important;font-size:12px!important;line-height:15px!important;color:#1b2349!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;transform:none!important;font-weight:850!important}
.story-v3-chip small{position:static!important;display:block!important;width:72px!important;max-width:72px!important;margin:2px 0 0!important;padding:0!important;color:#949aaa!important;font-size:11px!important;line-height:14px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;transform:none!important}
.community-media-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.community-card{position:relative;overflow:hidden;min-height:244px;border-radius:26px;background:#171529;box-shadow:0 18px 40px rgba(41,28,86,.16),0 2px 8px rgba(20,15,45,.08);border:1px solid rgba(255,255,255,.72)}
.community-card img,.community-card video{width:100%;height:100%;position:absolute;inset:0;object-fit:cover;transition:transform .3s ease}
.community-card:active img{transform:scale(1.02)}
.community-card:after{content:"";position:absolute;inset:34% 0 0;background:linear-gradient(transparent,rgba(10,8,23,.90))}
.community-copy{position:absolute;z-index:2;left:15px;right:15px;bottom:14px;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.35)}
.community-copy strong{display:block;font-size:18px;line-height:1.08;letter-spacing:-.02em}
.community-copy span{display:flex;align-items:center;gap:5px;margin-top:7px;font-size:12px;color:rgba(255,255,255,.92)}
.community-video-badge{position:absolute;z-index:3;right:12px;top:12px;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.92);color:#7547f4;box-shadow:0 7px 20px rgba(20,15,45,.15);backdrop-filter:blur(12px)}
.explore-v3-error{padding:10px 12px;border-radius:14px;background:#fff0f1;color:#a83b4b;margin-bottom:12px}
@media(max-width:430px){.explore-social-v3{padding-bottom:calc(158px + env(safe-area-inset-bottom,0px))}.explore-v3-head h2{font-size:25px}.people-add-strip{grid-auto-columns:minmax(148px,41%);padding-right:48px;scroll-padding-right:48px}.story-v3-strip{column-gap:7px!important}.story-v3-chip{grid-template-rows:68px auto auto!important}.story-v3-ring{width:68px!important;height:68px!important;min-width:68px!important;min-height:68px!important;max-width:68px!important;max-height:68px!important}.story-v3-chip strong,.story-v3-chip small{width:68px!important;max-width:68px!important}.community-card{min-height:224px}}
@media(max-width:360px){.people-add-strip{grid-auto-columns:146px}.story-v3-strip{column-gap:4px!important}.story-v3-chip{grid-template-rows:61px auto auto!important}.story-v3-ring{width:61px!important;height:61px!important;min-width:61px!important;min-height:61px!important;max-width:61px!important;max-height:61px!important}.story-v3-chip strong,.story-v3-chip small{width:61px!important;max-width:61px!important}.story-v3-chip strong{font-size:11px!important}.story-v3-chip small{font-size:10px!important}}
`;

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
  const advancePerson=(like:boolean)=>{const person=peopleState.filteredPeople[personIndex];if(person&&like)peopleState.toggleLike(person);setPersonIndex(index=>index+1);};
  const sendStoryReply=()=>{const active=storyIndex===null?null:storyState.stories[storyIndex];const text=storyReply.trim();if(!active||!text)return;const current=loadStored<Record<string,string[]>>(storageKeys.chatMessages,{});saveStored(storageKeys.chatMessages,{...current,[active.name]:[...(current[active.name]||[]),text]});setStoryReply('');onChat(active.name);};

  if(mode==='grid')return <PeopleGridView people={peopleState.filteredPeople} filter={peopleState.filter} locationAllowed={peopleState.locationAllowed} privacy={peopleState.privacy} liked={peopleState.liked} onFilter={peopleState.setFilter} onOpen={openSwipe} onToggleLike={peopleState.toggleLike} onBack={()=>setMode('main')}/>;
  if(mode==='swipe')return <><PeopleSwipeView people={peopleState.filteredPeople} index={personIndex} filter={peopleState.filter} locationAllowed={peopleState.locationAllowed} privacy={peopleState.privacy} onFilter={peopleState.setFilter} onBack={()=>setMode('main')} onAdvance={advancePerson} onDetail={setPersonDetail}/>{personDetail&&<PersonDetailCard person={personDetail} privacy={peopleState.privacy} onClose={()=>setPersonDetail(null)} onChat={onChat}/>}</>;

  const activeStory=storyIndex===null?null:storyState.stories[storyIndex];
  return <div className="page explore-page explore-social-v3"><style>{css}</style>
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
