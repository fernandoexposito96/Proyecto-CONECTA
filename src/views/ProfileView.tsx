import { useEffect, useMemo, useState } from 'react';
import { Languages, MapPin, Settings, ShieldCheck } from 'lucide-react';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import type { Plan, View } from '../types';

type ProfileTab='Fotos'|'Planes'|'Conexiones'|'Valoraciones';

const photos=['photo-1507525428034-b723cf961d3e','photo-1500530855697-b586d89ba3ee','photo-1533105079780-92b9be482077','photo-1544551763-46a013bb70d5','photo-1519046904884-53103b34b206','photo-1500534623283-312aade485b7'];
const defaultBio='Deporte, viajes, buena comida y conocer gente increíble. La vida son planes! ✈️🌍☕';

export function ProfileView({setView}:{setView:(v:View)=>void}){
  const [tab,setTab]=useState<ProfileTab>('Fotos');
  const [editing,setEditing]=useState(false);
  const [bio,setBio]=useState(()=>loadStored<string>(storageKeys.profileBio,defaultBio));
  const [draftBio,setDraftBio]=useState(bio);

  useEffect(()=>{saveStored(storageKeys.profileBio,bio)},[bio]);
  const saveProfile=()=>{setBio(draftBio.trim()||bio);setEditing(false)};

  const demoStats=useMemo(()=>{
    const created=loadStored<Plan[]>(storageKeys.createdPlans,[]);
    const joined=loadStored<string[]>(storageKeys.joinedPlans,[]);
    const connections=loadStored<string[]>(storageKeys.connections,[]);
    const favorites=loadStored<string[]>(storageKeys.planFavorites,[]);
    return {
      plans:23+created.length+joined.length,
      connections:156+connections.length,
      ratings:48,
      created:created.length,
      joined:joined.length,
      favorites:favorites.length,
      newConnections:connections.length,
    };
  },[]);

  return <div className="page profile-page"><div className="profile-cover"><img loading="lazy" decoding="async" src="./assets/images/photo-1500530855697-b586d89ba3ee.jpg" alt="Portada del perfil"/><button aria-label="Abrir ajustes" onClick={()=>setView('Ajustes')}><Settings/></button></div><div className="profile-main"><img className="profile-avatar" loading="lazy" decoding="async" src="./assets/images/photo-1500648767791-00dcc994a43e.jpg" alt="Foto de perfil de Fernando"/><button className="edit" onClick={()=>{setDraftBio(bio);setEditing(v=>!v)}}>{editing?'Cancelar':'Editar perfil'}</button><h1>Fernando <ShieldCheck/></h1><p>Tarragona</p><div className="stats"><div><strong>{demoStats.plans}</strong><span>Planes</span></div><div><strong>{demoStats.connections}</strong><span>Conexiones</span></div><div><strong>{demoStats.ratings}</strong><span>Valoraciones</span></div></div>{editing?<div className="profile-editor"><label>Biografía<textarea value={draftBio} onChange={e=>setDraftBio(e.target.value)} maxLength={180}/></label><button onClick={saveProfile}>Guardar cambios</button></div>:<p className="bio">{bio}</p>}<div className="profile-tags"><span><MapPin/> Tarragona</span><span><Languages/> Español, Catalán, Inglés</span><span><ShieldCheck/> Verificado</span></div><div className="profile-tabs">{(['Fotos','Planes','Conexiones','Valoraciones'] as ProfileTab[]).map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div>{tab==='Fotos'&&<div className="photo-grid">{photos.map((id,i)=><img key={id} loading="lazy" decoding="async" src={`./assets/images/${id}.jpg`} alt={`Foto ${i+1} del perfil`}/>)}</div>}{tab==='Planes'&&<div className="profile-tab-panel"><strong>{demoStats.plans} planes</strong><span>{demoStats.created} creados · {demoStats.joined} unidos · {demoStats.favorites} favoritos en este dispositivo.</span></div>}{tab==='Conexiones'&&<div className="profile-tab-panel"><strong>{demoStats.connections} conexiones</strong><span>{demoStats.newConnections} conexiones nuevas añadidas desde el demo actual.</span></div>}{tab==='Valoraciones'&&<div className="profile-tab-panel"><strong>4,8 ⭐</strong><span>{demoStats.ratings} valoraciones del contenido demo.</span></div>}</div></div>
}
