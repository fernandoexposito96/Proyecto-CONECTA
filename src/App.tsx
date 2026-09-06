import { useState } from 'react';
import { Bell, CalendarDays, ChevronLeft, ChevronRight, CircleUserRound, Coffee, Compass, Crown, Dumbbell, Film, Gamepad2, Heart, Home, MapPin, MessageCircle, Music2, Palmtree, Plane, Plus, Search, Settings, ShieldCheck, Sparkles, Star, UsersRound, Utensils, Mountain, Camera, BookOpen, GraduationCap, PawPrint, Languages, PartyPopper } from 'lucide-react';

type View = 'Inicio'|'Explora'|'Chat'|'Perfil'|'Ajustes';

type Plan = {title:string; image:string; time:string; place:string; distance:string; spots:string; category:string};

const plans: Plan[] = [
  {title:'Pádel Sunset',image:'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=88',time:'Hoy · 19:00',place:'Club Pádel Tarragona',distance:'5 km',spots:'6 plazas',category:'Deporte'},
  {title:'Cena entre amigos',image:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=88',time:'Hoy · 21:00',place:'Tarragona centro',distance:'2 km',spots:'8 plazas',category:'Comida'},
  {title:'Ruta al atardecer',image:'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=88',time:'Sáb · 10:30',place:'La Mussara',distance:'26 km',spots:'10 plazas',category:'Senderismo'},
];

const categories = [
  ['Deporte',Dumbbell,'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=82'],
  ['Comida',Utensils,'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=500&q=82'],
  ['Café',Coffee,'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=500&q=82'],
  ['Cine',Film,'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=82'],
  ['Música',Music2,'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=500&q=82'],
  ['Playa',Palmtree,'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=82'],
  ['Viajes',Plane,'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=82'],
  ['Senderismo',Mountain,'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=500&q=82'],
  ['Gaming',Gamepad2,'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=500&q=82'],
  ['Fotografía',Camera,'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=500&q=82'],
  ['Idiomas',Languages,'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=82'],
  ['Fiestas',PartyPopper,'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=500&q=82'],
  ['Familias',UsersRound,'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=500&q=82'],
  ['Estudiantes',GraduationCap,'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=82'],
  ['Lectura',BookOpen,'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=82'],
  ['Mascotas',PawPrint,'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=500&q=82'],
] as const;

const chats = [
  ['Grupo Pádel','Javi: Nos vemos a las 19:00! 🎾','3'],['Marta','Genial! Nos apuntamos 😊','1'],['Viaje a Madrid','Ana: He encontrado unos hoteles...','5'],['Carlos','¿Te apuntas al plan de mañana?',''],['Running Tarragona','Laura: Ruta confirmada ✅','2'],['Sara','Nos vemos allí! 🥰',''],['Cine y palomitas','Javi: Película confirmada 🎬','']
];

function BottomNav({view,setView}:{view:View,setView:(v:View)=>void}){
  return <nav className="bottom-nav">
    <button className={view==='Inicio'?'active':''} onClick={()=>setView('Inicio')}><Home/><span>Inicio</span></button>
    <button className={view==='Explora'?'active':''} onClick={()=>setView('Explora')}><Search/><span>Explora</span></button>
    <button className="create"><Plus/></button>
    <button className={view==='Chat'?'active':''} onClick={()=>setView('Chat')}><MessageCircle/><span>Chat</span></button>
    <button className={view==='Perfil'||view==='Ajustes'?'active':''} onClick={()=>setView('Perfil')}><CircleUserRound/><span>Perfil</span></button>
  </nav>
}

function Sidebar({view,setView}:{view:View,setView:(v:View)=>void}){
  const items:[View,any][]=[['Inicio',Home],['Explora',Compass],['Chat',MessageCircle],['Perfil',CircleUserRound],['Ajustes',Settings]];
  return <aside className="sidebar"><div className="brand"><strong>CONECTA</strong><span>Planes reales, gente compatible</span></div><nav>{items.map(([label,Icon])=><button key={label} className={view===label?'active':''} onClick={()=>setView(label)}><Icon/><span>{label}</span></button>)}</nav><div className="premium-box"><Crown/><strong>CONECTA Premium</strong><span>Más planes. Más personas. Más vida.</span><button onClick={()=>setView('Ajustes')}>Ver Premium</button></div></aside>
}

function Header({view}:{view:View}){
  return <header className="topbar"><div className="mobile-brand"><strong>{view==='Inicio'?'CONECTA':view}</strong><span>{view==='Inicio'?'Planes reales, gente compatible':'Tu mundo CONECTA'}</span></div><div className="desktop-search"><Search/><input placeholder="¿Qué te apetece hacer hoy?"/></div><div className="top-actions"><button><Bell/><i/></button><img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=85" alt="Fernando"/></div></header>
}

function HomeView({setView,onPlan}:{setView:(v:View)=>void,onPlan:(p:Plan)=>void}){
  return <div className="page home-page">
    <section className="hero"><img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=90"/><div className="hero-overlay"/><div className="hero-copy"><span><MapPin/> Tarragona</span><h1>La vida es mejor<br/>con buenos planes</h1><div className="hero-search"><Search/><span>¿Qué te apetece hacer hoy?</span></div></div></section>
    <section className="section"><div className="section-head"><h2>Descubre</h2><button onClick={()=>setView('Explora')}>Ver todo <ChevronRight/></button></div><div className="category-strip">{categories.slice(0,8).map(([name,Icon,image])=><button key={name} onClick={()=>setView('Explora')}><img src={image}/><span className="shade"/><b><Icon/>{name}</b></button>)}</div></section>
    <section className="section"><div className="section-head"><div><small>PARA TI</small><h2>Planes para ti</h2></div><button onClick={()=>setView('Explora')}>Ver todos <ChevronRight/></button></div><div className="plan-grid">{plans.map((p)=><article className="plan-card" key={p.title} onClick={()=>onPlan(p)}><div className="plan-image"><img src={p.image}/><button><Heart/></button><span>{p.category}</span></div><div className="plan-body"><h3>{p.title}</h3><p>{p.time}</p><p>{p.distance} · {p.spots}</p><div className="avatars"><img src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=80&q=80"/><img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80"/><img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80"/><span>+3</span></div></div></article>)}</div></section>
  </div>
}

function ExploreView({onPlan}:{onPlan:(p:Plan)=>void}){
  return <div className="page explore-page"><div className="page-title"><div><h1>Explora</h1><p>Descubre planes cerca de ti</p></div><button><Search/></button></div><div className="filter-row"><button className="active">Cerca de mí</button><button>Hoy</button><button>Este finde</button><button>Ordenar</button></div><div className="category-grid">{categories.map(([name,Icon,image])=><button key={name}><img src={image}/><span/><b><Icon/>{name}</b></button>)}</div><section className="section noframe"><div className="section-head"><h2>Recomendados</h2></div><div className="plan-grid">{plans.map(p=><article className="plan-card" key={p.title} onClick={()=>onPlan(p)}><div className="plan-image"><img src={p.image}/><span>{p.category}</span></div><div className="plan-body"><h3>{p.title}</h3><p>{p.time}</p><p>{p.place}</p></div></article>)}</div></section></div>
}

function PlanDetail({plan,onClose}:{plan:Plan,onClose:()=>void}){
  return <div className="detail-overlay"><article className="detail-card"><div className="detail-photo"><img src={plan.image}/><button className="back" onClick={onClose}><ChevronLeft/></button><button className="heart"><Heart/></button><span>1/5</span></div><div className="detail-body"><div className="detail-title"><h1>{plan.title}</h1><span>{plan.category}</span></div><div className="info-row"><CalendarDays/><div><strong>Hoy, 6 sep 2026</strong><span>19:00 - 21:00</span></div></div><div className="info-row"><MapPin/><div><strong>{plan.place}</strong><span>Tarragona · {plan.distance}</span></div><ChevronRight/></div><div className="info-row"><UsersRound/><div><strong>6 de 8 plazas</strong><span>Grupo abierto y buen ambiente</span></div></div><div className="participant-row"><div className="avatars big"><img src="https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=90&q=80"/><img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=90&q=80"/><img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=90&q=80"/></div><button>Ver todos <ChevronRight/></button></div><p className="description">Partido de pádel al atardecer. Buen ambiente y luego algo para tomar. ¡Planazo!</p><div className="chips"><span>Deporte</span><span>Social</span><span>Buen ambiente</span><span>+2</span></div><div className="organizer"><img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"/><div><small>Organiza</small><strong>Javi</strong><span>Valoración 4.8 ⭐</span></div><button>Seguir</button></div><button className="join"><UsersRound/>Unirme al plan</button></div></article></div>
}

function ChatView(){return <div className="page chat-page"><div className="page-title"><div><h1>Chat</h1><p>Tus conversaciones y grupos</p></div><button><Search/></button></div><div className="tabs"><button className="active">Todos</button><button>Planes</button><button>Grupos</button></div><div className="chat-list">{chats.map(([name,msg,count],i)=><button key={name}><img src={`https://images.unsplash.com/${['photo-1500648767791-00dcc994a43e','photo-1494790108377-be9c29b29330','photo-1500530855697-b586d89ba3ee','photo-1492562080023-ab3db95bfbce'][i%4]}?auto=format&fit=crop&w=100&q=80`}/><div><strong>{name}</strong><span>{msg}</span></div><small>{i<3?'12:'+(45-i*8):'Ayer'}</small>{count&&<b>{count}</b>}</button>)}</div></div>}

function ProfileView({setView}:{setView:(v:View)=>void}){return <div className="page profile-page"><div className="profile-cover"><img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=88"/><button onClick={()=>setView('Ajustes')}><Settings/></button></div><div className="profile-main"><img className="profile-avatar" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=220&q=90"/><button className="edit">Editar perfil</button><h1>Fernando <ShieldCheck/></h1><p>Tarragona</p><div className="stats"><div><strong>23</strong><span>Planes</span></div><div><strong>156</strong><span>Conexiones</span></div><div><strong>48</strong><span>Valoraciones</span></div></div><p className="bio">Deporte, viajes, buena comida y conocer gente increíble. La vida son planes! ✈️🌍☕</p><div className="profile-tags"><span><MapPin/> Tarragona</span><span><Languages/> Español, Catalán, Inglés</span><span><ShieldCheck/> Verificado</span></div><div className="profile-tabs"><button className="active">Fotos</button><button>Planes</button><button>Conexiones</button><button>Valoraciones</button></div><div className="photo-grid">{['photo-1507525428034-b723cf961d3e','photo-1500530855697-b586d89ba3ee','photo-1533105079780-92b9be482077','photo-1544551763-46a013bb70d5','photo-1519046904884-53103b34b206','photo-1500534623283-312aade485b7'].map(id=><img key={id} src={`https://images.unsplash.com/${id}?auto=format&fit=crop&w=500&q=82`}/>)}</div></div></div>}

function SettingsView(){const rows=[[Settings,'Ajustes','Personaliza tu experiencia'],[ShieldCheck,'Privacidad y seguridad','Tu seguridad es lo primero'],[Sparkles,'Guía CONECTA','Cómo funciona la app'],[Star,'Normas de la comunidad','Un mejor lugar para todos'],[MessageCircle,'Centro de ayuda','Soporte técnico'],[UsersRound,'Invitar amigos','Comparte CONECTA'],[CircleUserRound,'Sobre CONECTA','Versión Premium Max']];return <div className="page settings-page"><div className="premium-header"><div className="profile-inline"><img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=85"/><div><strong>CONECTA <span>Premium</span></strong><h2>Fernando</h2><p>Usuario Premium</p></div></div><Crown/></div><div className="gold-card"><Crown/><div><strong>CONECTA Premium</strong><span>Más planes. Más personas. Más vida.</span></div><ChevronRight/></div><div className="settings-list">{rows.map(([Icon,title,sub]:any)=><button key={title}><Icon/><div><strong>{title}</strong><span>{sub}</span></div><ChevronRight/></button>)}</div><button className="logout">Cerrar sesión</button></div>}

export default function App(){const [view,setView]=useState<View>('Inicio');const [selected,setSelected]=useState<Plan|null>(null);return <div className="app-shell"><Sidebar view={view} setView={setView}/><main><Header view={view}/><div className="content">{view==='Inicio'&&<HomeView setView={setView} onPlan={setSelected}/>} {view==='Explora'&&<ExploreView onPlan={setSelected}/>} {view==='Chat'&&<ChatView/>} {view==='Perfil'&&<ProfileView setView={setView}/>} {view==='Ajustes'&&<SettingsView/>}</div></main><BottomNav view={view} setView={setView}/>{selected&&<PlanDetail plan={selected} onClose={()=>setSelected(null)}/>}</div>}
