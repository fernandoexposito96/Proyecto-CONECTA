import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Check, MapPin, Plus, Search, UserPlus, Video } from 'lucide-react';
import { people } from '../data/demoData';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import { requestBackendConnection } from '../lib/socialBackend';
import { loadProfileMedia, searchPeopleByName, uploadProfileMedia, type PersonSearchResult, type ProfileMediaItem } from '../lib/communityBackend';
import type { Plan } from '../types';

const css=`
.explore-social-v2{padding-bottom:116px;background:linear-gradient(180deg,#fbf9ff 0%,#f7f2ff 48%,#fff 100%)}
.explore-v2-hero{padding:8px 0 18px}.explore-v2-hero small{display:block;color:#7c4df4;font-weight:950;letter-spacing:.22em;margin-bottom:5px}.explore-v2-hero h1{margin:0;color:#121a42;font-size:clamp(38px,8vw,54px);line-height:1}.explore-v2-hero p{margin:9px 0 0;color:#69718a;font-weight:700}
.explore-v2-search{display:grid;grid-template-columns:24px 1fr;align-items:center;gap:10px;padding:0 16px;height:52px;border:1px solid rgba(111,76,229,.14);border-radius:20px;background:#fff;box-shadow:0 12px 28px rgba(72,46,136,.07);margin-bottom:22px}.explore-v2-search svg{color:#667088}.explore-v2-search input{border:0;outline:0;background:transparent;font:inherit;color:#151c43;min-width:0}.explore-v2-search input::placeholder{color:#9ca2b2}
.explore-v2-section{margin:0 0 28px}.explore-v2-head{display:flex;align-items:end;justify-content:space-between;gap:14px;margin-bottom:13px}.explore-v2-head h2{margin:0;color:#151c43;font-size:28px}.explore-v2-head span,.explore-v2-head button{color:#7447f4;font-weight:850;border:0;background:transparent}
.people-add-strip{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(180px,1fr);gap:12px;overflow-x:auto;padding:2px 1px 7px;scroll-snap-type:x proximity}.people-add-card{scroll-snap-align:start;display:grid;justify-items:center;gap:8px;padding:16px 12px;border:1px solid rgba(116,71,244,.12);border-radius:24px;background:rgba(255,255,255,.95);box-shadow:0 13px 30px rgba(60,42,115,.08);min-width:0}.people-add-avatar{width:82px;height:82px;border-radius:50%;object-fit:cover;background:#eee9fb}.people-add-card strong{font-size:18px;color:#161d44}.people-add-card small{color:#81879a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}.people-add-card button{width:100%;height:40px;border-radius:999px;border:1.5px solid #7a4cf4;background:#fff;color:#7143ef;font-weight:900;display:flex;align-items:center;justify-content:center;gap:7px}.people-add-card button.connected{background:#7547f4;color:#fff}.people-add-empty{padding:18px;border-radius:20px;background:#fff;color:#777e91}
.story-v2-strip{display:flex;gap:15px;overflow-x:auto;padding:2px 1px 8px}.story-v2-chip{flex:0 0 74px;text-align:center}.story-v2-ring{width:68px;height:68px;margin:auto;border-radius:50%;padding:3px;background:linear-gradient(135deg,#7347f4,#bd6ae8);display:grid;place-items:center}.story-v2-ring>img,.story-v2-ring>video{width:100%;height:100%;border-radius:50%;object-fit:cover;border:3px solid #fff;background:#e9e2fb}.story-v2-add .story-v2-ring{background:#fff;border:2px dashed #7b4cf4;color:#7647f4}.story-v2-chip strong{display:block;margin-top:7px;font-size:12px;color:#1e2448;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.story-v2-chip small{display:block;color:#9298a8;font-size:11px;margin-top:2px}
.community-media-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.community-card{position:relative;overflow:hidden;min-height:240px;border-radius:24px;background:#171529;box-shadow:0 15px 32px rgba(44,32,88,.12)}.community-card img,.community-card video{width:100%;height:100%;position:absolute;inset:0;object-fit:cover}.community-card:after{content:"";position:absolute;inset:36% 0 0;background:linear-gradient(transparent,rgba(9,8,19,.84))}.community-copy{position:absolute;z-index:2;left:13px;right:13px;bottom:13px;color:#fff}.community-copy strong{display:block;font-size:17px;line-height:1.08}.community-copy span{display:flex;align-items:center;gap:5px;margin-top:6px;font-size:12px;opacity:.92}.community-video-badge{position:absolute;z-index:3;right:11px;top:11px;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.92);color:#7547f4}.explore-v2-error{padding:10px 12px;border-radius:14px;background:#fff0f1;color:#a83b4b;margin-bottom:12px}
@media(max-width:430px){.explore-v2-head h2{font-size:25px}.people-add-strip{grid-auto-columns:164px}.community-card{min-height:220px}}
`;

const fallbackCommunity=[
  {id:'demo-1',url:'./assets/images/photo-1507525428034-b723cf961d3e.jpg',mediaType:'image' as const,caption:'Atardecer increíble',place:'Tarragona'},
  {id:'demo-2',url:'./assets/images/photo-1517248135467-4c7edcad34c4.jpg',mediaType:'image' as const,caption:'Noche de amigos',place:'Salou'},
  {id:'demo-3',url:'./assets/images/photo-1551632811-561732d1e306.jpg',mediaType:'image' as const,caption:'Ruta de hoy',place:'La Mussara'},
  {id:'demo-4',url:'./assets/images/photo-1555396273-367ea4eb4db5.jpg',mediaType:'image' as const,caption:'Cena top',place:'Cambrils'},
];

export function ExploreSocialView({onPlan: _onPlan,onChat: _onChat}:{onPlan:(plan:Plan)=>void;extraPlans?:Plan[];initialFilter?:unknown;initialCategory?:string|null;onChat:(name:string)=>void}){
  const [query,setQuery]=useState('');
  const [remotePeople,setRemotePeople]=useState<PersonSearchResult[]>([]);
  const [searching,setSearching]=useState(false);
  const [connected,setConnected]=useState<Set<string>>(()=>new Set(loadStored<string[]>(storageKeys.connections,[])));
  const [media,setMedia]=useState<ProfileMediaItem[]>([]);
  const [error,setError]=useState('');
  const [uploading,setUploading]=useState(false);
  const fileRef=useRef<HTMLInputElement|null>(null);

  useEffect(()=>{let active=true;void loadProfileMedia().then(items=>{if(active)setMedia(items)}).catch(()=>{});return()=>{active=false}},[]);
  useEffect(()=>{
    const clean=query.trim();
    if(clean.length<2){setRemotePeople([]);setSearching(false);return;}
    let active=true;setSearching(true);
    const timer=window.setTimeout(()=>{void searchPeopleByName(clean).then(items=>{if(active)setRemotePeople(items)}).catch(()=>{if(active)setRemotePeople([])}).finally(()=>{if(active)setSearching(false)})},220);
    return()=>{active=false;window.clearTimeout(timer)};
  },[query]);

  const demoPeople=useMemo(()=>people.filter(person=>!query.trim()||person.name.toLocaleLowerCase('es').includes(query.trim().toLocaleLowerCase('es'))).slice(0,8),[query]);
  const addDemo=(name:string)=>{setConnected(prev=>{const next=new Set(prev);next.add(name);saveStored(storageKeys.connections,[...next]);return next})};
  const addRemote=async(person:PersonSearchResult)=>{setError('');try{await requestBackendConnection(person.id);setConnected(prev=>new Set(prev).add(person.id));}catch(e){setError(e instanceof Error?e.message:'No se ha podido añadir a esta persona.')}};
  const upload=async(file?:File)=>{if(!file)return;setUploading(true);setError('');try{const item=await uploadProfileMedia(file,'status');setMedia(prev=>[item,...prev]);}catch(e){setError(e instanceof Error?e.message:'No se ha podido subir el estado.')}finally{setUploading(false);if(fileRef.current)fileRef.current.value='';}};

  const community=[...media.slice(0,6).map(item=>({id:item.id,url:item.url,mediaType:item.mediaType,caption:item.caption||'Tu nuevo estado',place:'Tu perfil'})),...fallbackCommunity].slice(0,8);

  return <div className="page explore-page explore-social-v2"><style>{css}</style>
    <div className="explore-v2-hero"><small>CONECTA</small><h1>Explora</h1><p>Conecta con personas y descubre experiencias</p></div>
    <label className="explore-v2-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busca personas por nombre..." aria-label="Buscar personas por nombre"/></label>
    {error&&<div className="explore-v2-error" role="alert">{error}</div>}

    <section className="explore-v2-section"><div className="explore-v2-head"><h2>Añadir personas</h2><span>{searching?'Buscando…':query.trim()?'Resultados':'Sugerencias'}</span></div>
      <div className="people-add-strip">
        {remotePeople.map(person=><article className="people-add-card" key={person.id}>{person.avatar?<img className="people-add-avatar" src={person.avatar} alt={person.name}/>:<div className="people-add-avatar"/>}<strong>{person.name}</strong><small>{person.username?`@${person.username}`:(person.city||'CONECTA')}</small><button className={connected.has(person.id)?'connected':''} disabled={connected.has(person.id)} onClick={()=>{void addRemote(person)}}>{connected.has(person.id)?<><Check/>Añadido</>:<><UserPlus/>Añadir</>}</button></article>)}
        {!remotePeople.length&&demoPeople.map(person=><article className="people-add-card" key={person.name}><img className="people-add-avatar" src={person.image} alt={person.name}/><strong>{person.name}, {person.age}</strong><small><MapPin/> {person.distance}</small><button className={connected.has(person.name)?'connected':''} disabled={connected.has(person.name)} onClick={()=>addDemo(person.name)}>{connected.has(person.name)?<><Check/>Añadido</>:<><UserPlus/>Añadir</>}</button></article>)}
        {query.trim().length>=2&&!searching&&!remotePeople.length&&!demoPeople.length&&<div className="people-add-empty">No encontramos a nadie con ese nombre.</div>}
      </div>
    </section>

    <section className="explore-v2-section"><div className="explore-v2-head"><h2>Estados</h2><button type="button" onClick={()=>fileRef.current?.click()} disabled={uploading}>{uploading?'Subiendo…':'Subir estado'}</button></div>
      <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" onChange={e=>{void upload(e.target.files?.[0])}}/>
      <div className="story-v2-strip"><button className="story-v2-chip story-v2-add" type="button" onClick={()=>fileRef.current?.click()}><span className="story-v2-ring"><Plus/></span><strong>Subir estado</strong><small>Foto o vídeo</small></button>{media.slice(0,4).map(item=><div className="story-v2-chip" key={item.id}><span className="story-v2-ring">{item.mediaType==='video'?<video src={item.url} muted playsInline/>:<img src={item.url} alt="Tu estado"/>}</span><strong>Tu estado</strong><small>Ahora</small></div>)}{people.slice(0,4).map(person=><div className="story-v2-chip" key={person.name}><span className="story-v2-ring"><img src={person.image} alt={person.name}/></span><strong>{person.name}</strong><small>Reciente</small></div>)}</div>
    </section>

    <section className="explore-v2-section"><div className="explore-v2-head"><h2>Novedades de la comunidad</h2><span>Fotos y vídeos</span></div><div className="community-media-grid">{community.map(item=><article className="community-card" key={item.id}>{item.mediaType==='video'?<><video src={item.url} controls playsInline preload="metadata"/><span className="community-video-badge"><Video size={18}/></span></>:<><img src={item.url} alt={item.caption}/><span className="community-video-badge"><Camera size={18}/></span></>}<div className="community-copy"><strong>{item.caption}</strong><span><MapPin size={14}/>{item.place}</span></div></article>)}</div></section>
  </div>;
}
