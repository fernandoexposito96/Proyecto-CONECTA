import { Bell, CircleUserRound, Compass, Crown, Home, MessageCircle, Plus, Search, Settings } from 'lucide-react';
import type { View } from '../types';

export function BottomNav({view,setView}:{view:View,setView:(v:View)=>void}){
  return <nav className="bottom-nav">
    <button className={view==='Inicio'?'active':''} onClick={()=>setView('Inicio')}><Home/><span>Inicio</span></button>
    <button className={view==='Explora'?'active':''} onClick={()=>setView('Explora')}><Search/><span>Explora</span></button>
    <button className={`create ${view==='Crear'?'active':''}`} aria-label="Crear plan" onClick={()=>setView('Crear')}><Plus/></button>
    <button className={view==='Chat'?'active':''} onClick={()=>setView('Chat')}><MessageCircle/><span>Chat</span></button>
    <button className={view==='Perfil'||view==='Ajustes'?'active':''} onClick={()=>setView('Perfil')}><CircleUserRound/><span>Perfil</span></button>
  </nav>
}

export function Sidebar({view,setView}:{view:View,setView:(v:View)=>void}){
  const items:[View,any][]=[['Inicio',Home],['Explora',Compass],['Chat',MessageCircle],['Perfil',CircleUserRound],['Ajustes',Settings]];
  return <aside className="sidebar">
    <div className="brand"><strong>CONECTA</strong><span>Planes reales, gente compatible</span></div>
    <nav>{items.map(([label,Icon])=><button key={label} className={view===label?'active':''} onClick={()=>setView(label)}><Icon/><span>{label}</span></button>)}</nav>
    <div className="premium-box"><Crown/><strong>CONECTA Premium</strong><span>Más planes. Más personas. Más vida.</span><button onClick={()=>setView('Ajustes')}>Ver Premium</button></div>
  </aside>
}

export function Header({view,setView}:{view:View,setView:(v:View)=>void}){
  return <header className="topbar">
    {view==='Inicio'&&<div className="mobile-brand"><strong>CONECTA</strong><span>Planes reales, gente compatible</span></div>}
    <div className="desktop-search"><Search/><input placeholder="¿Qué te apetece hacer hoy?" aria-label="Buscar planes" onFocus={()=>setView('Explora')} onKeyDown={e=>{if(e.key==='Enter')setView('Explora')}}/></div>
    <div className="top-actions"><button aria-label="Abrir notificaciones" onClick={()=>setView('Notificaciones')}><Bell/><i/></button><button className="top-avatar" aria-label="Abrir perfil" onClick={()=>setView('Perfil')}><img decoding="async" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=85" alt="Fernando"/></button></div>
  </header>
}
