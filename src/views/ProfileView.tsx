import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Camera, ChevronRight, MapPin, MoreHorizontal, Pencil, ShieldCheck, Star, UsersRound } from 'lucide-react';
import { countMyPlanMemberships } from '../lib/attendanceBackend';
import { accountFromUser, avatarFromUser, demoAccount, demoAvatar, isDemoAccount } from '../lib/identity';
import { blockedNames, canUseLocation, loadPrivacySettings } from '../lib/privacy';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { loadIdentityVerification } from '../lib/verificationBackend';
import type { AccountSettings, Plan, ProfileTab, View } from '../types';

const photos=['photo-1507525428034-b723cf961d3e','photo-1500530855697-b586d89ba3ee','photo-1533105079780-92b9be482077','photo-1544551763-46a013bb70d5','photo-1519046904884-53103b34b206','photo-1500534623283-312aade485b7'];
const coverPhotos=['photo-1500530855697-b586d89ba3ee','photo-1507525428034-b723cf961d3e','photo-1533105079780-92b9be482077'];
const demoBio='Me encanta descubrir nuevos sitios, la buena comida y los planes espontáneos. Siempre es mejor vivir experiencias en buena compañía.';
const emptyBio='Añade una biografía desde Editar perfil.';

export function ProfileView({setView}:{setView:(v:View)=>void}){
  const [privacy]=useState(loadPrivacySettings);
  const [blocked]=useState<Set<string>>(()=>blockedNames());
  const [tab,setTab]=useState<ProfileTab>('Fotos');
  const [editing,setEditing]=useState(false);
  const [account,setAccount]=useState<AccountSettings>(()=>loadStored(storageKeys.settingsAccount,demoAccount));
  const [avatar,setAvatar]=useState(demoAvatar);
  const [bio,setBio]=useState(()=>loadStored<string>(storageKeys.profileBio,''));
  const [draftBio,setDraftBio]=useState(bio);
  const [coverIndex,setCoverIndex]=useState(0);
  const [profileSaving,setProfileSaving]=useState(false);
  const [profileError,setProfileError]=useState('');
  const [verified,setVerified]=useState(false);
  const [city,setCity]=useState('Tarragona');
  const [interests,setInterests]=useState<string[]>([]);
  const [realJoinedCount,setRealJoinedCount]=useState(0);
  const [realCreatedCount,setRealCreatedCount]=useState(0);
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

        const [{data:profile,error:profileLoadError},{count,error:createdCountError}]=await Promise.all([
          supabase.from('profiles').select('bio,city,interests,avatar_url').eq('id',data.user.id).maybeSingle(),
          supabase.from('plans').select('id',{count:'exact',head:true}).eq('creator_id',data.user.id),
        ]);
        if(profileLoadError)throw profileLoadError;
        if(createdCountError)throw createdCountError;
        if(!active)return;

        if(profile&&typeof profile.bio==='string'){
          setBio(profile.bio);
          setDraftBio(profile.bio);
        }
        if(profile&&typeof profile.city==='string'&&profile.city.trim())setCity(profile.city.trim());
        if(profile&&Array.isArray(profile.interests))setInterests(profile.interests.map(value=>String(value)).filter(Boolean));
        if(profile&&typeof profile.avatar_url==='string'&&profile.avatar_url)setAvatar(profile.avatar_url);
        setRealCreatedCount(count||0);
      })
      .catch(error=>{
        console.warn('CONECTA profile load failed; local profile kept',error);
        if(active)setProfileError('No se ha podido sincronizar el perfil. Se mantienen tus datos locales.');
      });
    return ()=>{active=false};
  },[]);

  useEffect(()=>{
    let active=true;
    void Promise.allSettled([loadIdentityVerification(),countMyPlanMemberships()]).then(results=>{
      if(!active)return;
      const verification=results[0];
      const memberships=results[1];
      if(verification.status==='fulfilled')setVerified(verification.value.status==='approved');
      else console.warn('CONECTA identity verification check failed; badge hidden',verification.reason);
      if(memberships.status==='fulfilled')setRealJoinedCount(memberships.value);
      else console.warn('CONECTA real plan membership count failed',memberships.reason);
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
    const localCreatedCount=created.filter(plan=>!plan.backendId).length;
    const localJoinedCount=joined.filter(key=>!key.startsWith('backend:')).length;
    const createdCount=realCreatedCount+localCreatedCount;
    const joinedCount=realJoinedCount+localJoinedCount;
    return {
      plans:(demo?23:0)+createdCount+joinedCount,
      connections:(demo?156:0)+connections.length,
      ratings:demo?48:0,
      ratingScore:demo?'4,8':'—',
      created:createdCount,
      joined:joinedCount,
      favorites:favorites.length,
      newConnections:connections.length,
    };
  },[account,blocked,realCreatedCount,realJoinedCount]);

  const visibleInterests=interests.length?interests.slice(0,3):['Viajes','Gastronomía','Naturaleza'];

  return <div className="page profile-page">
    <div className="profile-shell">
      <div className="profile-cover">
        <img loading="lazy" decoding="async" src={`./assets/images/${coverPhotos[coverIndex]}.jpg`} alt="Portada del perfil"/>
        <div className="profile-cover-glow" aria-hidden="true"/>
        <span className="profile-cover-copy" aria-hidden="true">Buenas experiencias<br/>mejores personas ♡</span>
        <button type="button" className="profile-cover-action" onClick={()=>setCoverIndex(i=>(i+1)%coverPhotos.length)}><Camera/> Cambiar portada</button>
      </div>

      <div className="profile-main">
        <div className="profile-avatar-wrap">
          <img className="profile-avatar" loading="lazy" decoding="async" src={avatar} alt={`Foto de perfil de ${account.name}`}/>
          <span className="profile-online-dot" aria-label="Perfil activo"/>
        </div>

        <div className="profile-heading">
          <div className="profile-identity">
            <h1>{account.name}</h1>
            <p className="profile-location"><MapPin/> {locationAllowed?city:'Ubicación oculta a otros usuarios'}</p>
            {verified&&<span className="profile-verification"><ShieldCheck/> Perfil verificado</span>}
          </div>
          <div className="profile-actions">
            <button type="button" className="profile-edit-btn" onClick={()=>{setDraftBio(bio);setProfileError('');setEditing(v=>!v)}}><Pencil/>{editing?'Cancelar':'Editar perfil'}</button>
            <button type="button" className="profile-more-btn" aria-label="Más opciones" onClick={()=>setView('Ajustes')}><MoreHorizontal/></button>
          </div>
        </div>

        {editing?<div className="profile-editor"><label>Biografía<textarea value={draftBio} onChange={e=>setDraftBio(e.target.value)} maxLength={180}/></label><button type="button" disabled={profileSaving} onClick={()=>{void saveProfile()}}>{profileSaving?'Guardando…':'Guardar cambios'}</button></div>:<>
          <p className="profile-bio">{displayBio}</p>
          <div className="profile-interests" aria-label="Intereses">{visibleInterests.map(value=><span key={value}>{value}</span>)}{interests.length>3&&<span>+{interests.length-3}</span>}</div>
        </>}
        {profileError&&<p className="profile-error" role="alert">{profileError}</p>}

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

        <div className="profile-tabs">{(['Fotos','Planes','Conexiones','Valoraciones'] as ProfileTab[]).map(t=><button type="button" key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div>

        {tab==='Fotos'&&<div className="photo-grid">{photos.map((id,i)=><img key={id} loading="lazy" decoding="async" src={`./assets/images/${id}.jpg`} alt={`Foto ${i+1} del perfil`}/>)}</div>}
        {tab==='Planes'&&<div className="profile-tab-panel"><strong>{demoStats.plans} planes</strong><span>{demoStats.created} creados · {demoStats.joined} unidos · {demoStats.favorites} favoritos en este dispositivo.</span></div>}
        {tab==='Conexiones'&&<div className="profile-tab-panel"><strong>{demoStats.connections} conexiones</strong><span>{demoStats.newConnections} conexiones nuevas visibles después de aplicar bloqueos.</span></div>}
        {tab==='Valoraciones'&&<div className="profile-tab-panel"><strong>{demoStats.ratingScore}</strong><span>{demoStats.ratings} valoraciones asociadas a este perfil.</span></div>}
      </div>
    </div>
  </div>
}
