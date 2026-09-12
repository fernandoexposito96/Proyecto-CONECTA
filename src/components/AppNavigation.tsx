import { useEffect, useState } from 'react';
import { Bell, CircleUserRound, Compass, Crown, Home, MessageCircle, Plus, Search, Settings } from 'lucide-react';
import { accountFromUser, avatarFromUser, demoAccount, demoAvatar } from '../lib/identity';
import { supabase } from '../lib/supabase';
import type { View } from '../types';

const isHomeFlow=(view:View)=>view==='Inicio'||view==='HomeBrowse';

export function BottomNav({view,setView,activeView=view}:{view:View;setView:(v:View)=>void;activeView?:View}){
  return <nav className="bottom-nav" aria-label="Navegación principal">
    <button type="button" className={isHomeFlow(activeView)?'active':''} onClick={()=>setView('Inicio')}><Home/><span>Inicio</span></button>
    <button type="button" className={activeView==='Explora'?'active':''} onClick={()=>setView('Explora')}><Search/><span>Explora</span></button>
    <button type="button" className={`create ${activeView==='Crear'?'active':''}`} aria-label="Crear plan" onClick={()=>setView('Crear')}><Plus/></button>
    <button type="button" className={activeView==='Chat'?'active':''} onClick={()=>setView('Chat')}><MessageCircle/><span>Chat</span></button>
    <button type="button" className={activeView==='Perfil'||activeView==='Ajustes'?'active':''} onClick={()=>setView('Perfil')}><CircleUserRound/><span>Perfil</span></button>
  </nav>
}

export function Sidebar({view,setView,activeView=view}:{view:View;setView:(v:View)=>void;activeView?:View}){
  const items:[View,typeof Home][]=[['Inicio',Home],['Explora',Compass],['Chat',MessageCircle],['Perfil',CircleUserRound],['Ajustes',Settings]];
  return <aside className="sidebar">
    <div className="brand"><strong>CONECTA</strong><span>Planes reales, gente compatible</span></div>
    <nav aria-label="Navegación lateral">{items.map(([label,Icon])=>{
      const active=label==='Inicio'?isHomeFlow(activeView):activeView===label;
      return <button type="button" key={label} className={active?'active':''} onClick={()=>setView(label)}><Icon/><span>{label}</span></button>;
    })}</nav>
    <div className="premium-box"><Crown/><strong>CONECTA Premium</strong><span>Más planes. Más personas. Más vida.</span><button type="button" onClick={()=>setView('Ajustes')}>Ver Premium</button></div>
  </aside>
}

export function Header({view,setView,unreadNotifications=0}:{view:View;setView:(v:View)=>void;unreadNotifications?:number}){
  const isHome=view==='Inicio';
  const [profileName,setProfileName]=useState(demoAccount.name);
  const [profileAvatar,setProfileAvatar]=useState(demoAvatar);

  useEffect(()=>{
    let active=true;
    void supabase.auth.getUser()
      .then(({data,error})=>{
        if(error)throw error;
        if(!active)return;
        const account=accountFromUser(data.user);
        setProfileName(account.name);
        setProfileAvatar(avatarFromUser(data.user,account.name));
      })
      .catch(error=>console.warn('CONECTA header identity unavailable; demo identity kept',error));
    return ()=>{active=false};
  },[]);

  const openSearch=()=>setView('Explora');

  return <header className={`topbar ${isHome?'topbar-home':'topbar-compact'}`}>
    {isHome&&<div className="mobile-brand"><i className="brand-orb"/><div><strong>CONECTA</strong><span>Planes reales, gente compatible</span></div></div>}
    <div className="desktop-search"><Search/><input readOnly value="" placeholder="¿Qué te apetece hacer hoy?" aria-label="Abrir búsqueda de planes" onFocus={openSearch} onClick={openSearch} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openSearch()}}}/></div>
    <div className="top-actions">
      {isHome&&<button type="button" className="mobile-home-search" aria-label="Buscar planes" onClick={openSearch}><Search/></button>}
      <button type="button" aria-label={unreadNotifications?`Abrir notificaciones, ${unreadNotifications} sin leer`:'Abrir notificaciones'} onClick={()=>setView('Notificaciones')}><Bell/>{unreadNotifications>0&&<i/>}</button>
      <button type="button" className="top-avatar" aria-label="Abrir perfil" onClick={()=>setView('Perfil')}><img decoding="async" src={profileAvatar} alt={profileName}/></button>
    </div>
  </header>
}
