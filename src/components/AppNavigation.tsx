import { useEffect, useState } from 'react';
import { Bell, CircleUserRound, Compass, Crown, Home, MessageCircle, Plus, Search, Settings } from 'lucide-react';
import { accountFromUser, avatarFromUser, demoAccount, demoAvatar } from '../lib/identity';
import { supabase } from '../lib/supabase';
import type { View } from '../types';

export function BottomNav({view,setView}:{view:View,setView:(v:View)=>void}){
  return <nav className="bottom-nav" aria-label="Navegación principal">
    <button type="button" className={view==='Inicio'?'active':''} onClick={()=>setView('Inicio')}><Home/><span>Inicio</span></button>
    <button type="button" className={view==='Explora'?'active':''} onClick={()=>setView('Explora')}><Search/><span>Explora</span></button>
    <button type="button" className={`create ${view==='Crear'?'active':''}`} aria-label="Crear plan" onClick={()=>setView('Crear')}><Plus/></button>
    <button type="button" className={view==='Chat'?'active':''} onClick={()=>setView('Chat')}><MessageCircle/><span>Chat</span></button>
    <button type="button" className={view==='Perfil'||view==='Ajustes'?'active':''} onClick={()=>setView('Perfil')}><CircleUserRound/><span>Perfil</span></button>
  </nav>
}

export function Sidebar({view,setView}:{view:View,setView:(v:View)=>void}){
  const items:[View,typeof Home][]=[['Inicio',Home],['Explora',Compass],['Chat',MessageCircle],['Perfil',CircleUserRound],['Ajustes',Settings]];
  return <aside className="sidebar">
    <div className="brand"><strong>CONECTA</strong><span>Planes reales, gente compatible</span></div>
    <nav aria-label="Navegación lateral">{items.map(([label,Icon])=><button type="button" key={label} className={view===label?'active':''} onClick={()=>setView(label)}><Icon/><span>{label}</span></button>)}</nav>
    <div className="premium-box"><Crown/><strong>CONECTA Premium</strong><span>Más planes. Más personas. Más vida.</span><button type="button" onClick={()=>setView('Ajustes')}>Ver Premium</button></div>
  </aside>
}

export function Header({view,setView}:{view:View,setView:(v:View)=>void}){
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

  return <header className={`topbar ${isHome?'topbar-home':'topbar-compact'}`}>
    {isHome&&<div className="mobile-brand"><strong>CONECTA</strong><span>Planes reales, gente compatible</span></div>}
    <div className="desktop-search"><Search/><input placeholder="¿Qué te apetece hacer hoy?" aria-label="Buscar planes" onFocus={()=>setView('Explora')} onKeyDown={e=>{if(e.key==='Enter')setView('Explora')}}/></div>
    <div className="top-actions"><button type="button" aria-label="Abrir notificaciones" onClick={()=>setView('Notificaciones')}><Bell/><i/></button><button type="button" className="top-avatar" aria-label="Abrir perfil" onClick={()=>setView('Perfil')}><img decoding="async" src={profileAvatar} alt={profileName}/></button></div>
  </header>
}
