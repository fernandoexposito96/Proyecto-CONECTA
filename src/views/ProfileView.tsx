import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, Languages, MapPin, Pencil, Quote, Settings, ShieldCheck, Star, UsersRound } from 'lucide-react';
import { accountFromUser, avatarFromUser, demoAccount, demoAvatar, isDemoAccount } from '../lib/identity';
import { blockedNames, canUseLocation, loadPrivacySettings } from '../lib/privacy';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import { supabase } from '../lib/supabase';
import type { AccountSettings, Plan, ProfileTab, View } from '../types';

const photos=['photo-1507525428034-b723cf961d3e','photo-1500530855697-b586d89ba3ee','photo-1533105079780-92b9be482077','photo-1544551763-46a013bb70d5','photo-1519046904884-53103b34b206','photo-1500534623283-312aade485b7'];
const demoBio='Deporte, viajes, buena comida y conocer gente increíble. La vida son planes! ✈️🌍☕';
const emptyBio='Añade una biografía para contar qué planes te gustan y qué buscas en CONECTA.';

export function ProfileView({setView}:{setView:(v:View)=>void}){
  const [privacy]=useState(loadPrivacySettings);
  const [blocked]=useState<Set<string>>(()=>blockedNames());
  const [tab,setTab]=useState<ProfileTab>('Fotos');
  const [editing,setEditing]=useState(false);
  const [account,setAccount]=useState<AccountSettings>(()=>loadStored(storageKeys.settingsAccount,demoAccount));
  const [avatar,setAvatar]=useState(demoAvatar);
  const [bio,setBio]=useState(()=>loadStored<string>(storageKeys.profileBio,''));
  const [draftBio,setDraftBio]=useState(bio);
  const [profileSaving,setProfileSaving]=useState(false);
  const [profileError,setProfileError]=useState('');
  const locationAllowed=canUseLocation(privacy);

  useEffect(()=>{
    let active=true;
    void supabase.auth.getUser()
      .then(async({data,error})=>{
        if(error)throw error;
        if(!active)return;
        const stored=loadStored<AccountSettings>(storageKeys.settingsAccount,demoAccount);
        const next=accountFromUser(data.user,stored);
        setAccount(next);
        setAvatar(avatarFromUser(data.user,next.name));
        if(next.name!==stored.name||next.email!==stored.email)saveStored(storageKeys.settingsAccount,next);
        if(!data.user)return;
        const {data:profile,error:profileLoadError}=await supabase.from('profiles').select('bio').eq('id',data.user.id).maybeSingle();
        if(profileLoadError)throw profileLoadError;
        if(active&&profile&&typeof profile.bio==='string'){
          setBio(profile.bio);
          setDraftBio(profile.bio);
        }
      })
      .catch(error=>{
        console.warn('CONECTA profile load failed; local profile kept',error);
        if(active)setProfileError('No se ha podido sincronizar el perfil. Se mantienen tus datos locales.');
      });
    return ()=>{active=false};
  },[]);

  useEffect(()=>{saveStored(storageKeys.profileBio,bio)},[bio]);

  const displayBio=bio||(isDemoAccount(account)?demoBio:emptyBio);
  const saveProfile=async()=>{
    const clean=draftBio.trim();
    setProfileSaving(true);
    setProfileError('');
    try{
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError)throw userError;
      if(!user)throw new Error('Necesitas iniciar sesión para guardar el perfil.');
      const {error}=await supabase.from('profiles').upsert({id:user.id,display_name:account.name,bio:clean},{onConflict:'id'});
      if(error)throw error;
      setBio(clean);
      setEditing(false);
    }catch(error){
      console.warn('CONECTA profile save failed',error);
      setProfileError(error instanceof Error?error.message:'No se ha podido guardar el perfil.');
    }finally{
      setProfileSaving(false);
    }
  };

  const demoStats=useMemo(()=>{
    const created=loadStored<Plan[]>(storageKeys.createdPlans,[]);
    const joined=loadStored<string[]>(storageKeys.joinedPlans,[]);
    const connections=loadStored<string[]>(storageKeys.connections,[]).filter(name=>!blocked.has(name));
    const favorites=loadStored<string[]>(storageKeys.planFavorites,[]);
    const demo=isDemoAccount(account);
    return {
      plans:(demo?23:0)+created.length+joined.length,
      connections:(demo?156:0)+connections.length,
      ratings:demo?48:0,
      ratingScore:demo?'4,8':'—',
      created:created.length,
      joined:joined.length,
      favorites:favorites.length,
      newConnections:connections.length,
    };
  },[account,blocked]);

  return <div className="page profile-page">
    <div className="profile-shell">
      <div className="profile-cover">
        <img loading="lazy" decoding="async" src="./assets/images/photo-1500530855697-b586d89ba3ee.jpg" alt="Portada del perfil"/>
        <div className="profile-cover-glow" aria-hidden="true"/>
        <button type="button" className="profile-settings" aria-label="Abrir ajustes" onClick={()=>setView('Ajustes')}><Settings/></button>
      </div>

      <div className="profile-main">
        <div className="profile-avatar-wrap">
          <img className="profile-avatar" loading="lazy" decoding="async" src={avatar} alt={`Foto de perfil de ${account.name}`}/>
          <span className="profile-online-dot" aria-label="Perfil activo"/>
        </div>

        <div className="profile-heading">
          <div className="profile-identity">
            <h1>{account.name}</h1>
            <p className="profile-location"><MapPin/> {locationAllowed?'Tarragona':'Ubicación oculta a otros usuarios'}</p>
            <span className="profile-verification"><ShieldCheck/> Perfil verificado</span>
          </div>
          <button type="button" className="profile-edit-btn" onClick={()=>{setDraftBio(bio);setProfileError('');setEditing(v=>!v)}}><Pencil/>{editing?'Cancelar':'Editar perfil'}</button>
        </div>

        <div className="profile-stats" aria-label="Resumen del perfil">
          <button type="button" onClick={()=>setTab('Planes')}>
            <span className="profile-stat-icon"><CalendarDays/></span>
            <span><strong>{demoStats.plans}</strong><small>Planes</small></span>
            <ChevronRight/>
          </button>
          <button type="button" onClick={()=>setTab('Conexiones')}>
            <span className="profile-stat-icon"><UsersRound/></span>
            <span><strong>{demoStats.connections}</strong><small>Conexiones</small></span>
            <ChevronRight/>
          </button>
          <button type="button" onClick={()=>setTab('Valoraciones')}>
            <span className="profile-stat-icon"><Star/></span>
            <span><strong>{demoStats.ratingScore}</strong><small>Valoraciones</small></span>
            <ChevronRight/>
          </button>
        </div>

        {editing?<div className="profile-editor"><label>Biografía<textarea value={draftBio} onChange={e=>setDraftBio(e.target.value)} maxLength={180}/></label><button type="button" disabled={profileSaving} onClick={()=>{void saveProfile()}}>{profileSaving?'Guardando…':'Guardar cambios'}</button></div>:<div className="profile-about-card"><Quote/><p>{displayBio}</p></div>}
        {profileError&&<p className="profile-error" role="alert">{profileError}</p>}

        <div className="profile-tags">
          <span><MapPin/> {locationAllowed?'Tarragona':'Ubicación privada'}</span>
          <span><Languages/> Español, Catalán, Inglés</span>
          <span><UsersRound/> {privacy.profileVisibility}</span>
        </div>

        <div className="profile-tabs">{(['Fotos','Planes','Conexiones','Valoraciones'] as ProfileTab[]).map(t=><button type="button" key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div>

        {tab==='Fotos'&&<div className="photo-grid">{photos.map((id,i)=><img key={id} loading="lazy" decoding="async" src={`./assets/images/${id}.jpg`} alt={`Foto ${i+1} del perfil`}/>)}</div>}
        {tab==='Planes'&&<div className="profile-tab-panel"><strong>{demoStats.plans} planes</strong><span>{demoStats.created} creados · {demoStats.joined} unidos · {demoStats.favorites} favoritos en este dispositivo.</span></div>}
        {tab==='Conexiones'&&<div className="profile-tab-panel"><strong>{demoStats.connections} conexiones</strong><span>{demoStats.newConnections} conexiones nuevas visibles después de aplicar bloqueos.</span></div>}
        {tab==='Valoraciones'&&<div className="profile-tab-panel"><strong>{demoStats.ratingScore}</strong><span>{demoStats.ratings} valoraciones asociadas a este perfil.</span></div>}
      </div>
    </div>
  </div>
}
