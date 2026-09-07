import { useEffect, useState } from 'react';
import { BottomNav, Header, Sidebar } from './components/AppNavigation';
import { PlanDetail } from './components/PlanComponents';
import type { Plan, View } from './types';
import { ChatView } from './views/ChatView';
import { CreatePlanView } from './views/CreatePlanView';
import { ExploreView } from './views/ExploreView';
import { HomeView } from './views/HomeView';
import { NotificationsView } from './views/NotificationsView';
import { ProfileView } from './views/ProfileView';
import { SettingsView } from './views/SettingsView';

export default function App(){
  const [view,setView]=useState<View>('Inicio');
  const [selected,setSelected]=useState<Plan|null>(null);

  useEffect(()=>{
    setSelected(null);
    window.scrollTo({top:0,left:0,behavior:'auto'});
  },[view]);

  return <div className="app-shell">
    <Sidebar view={view} setView={setView}/>
    <main>
      <Header view={view} setView={setView}/>
      <div className="content">
        {view==='Inicio'&&<HomeView setView={setView} onPlan={setSelected}/>} 
        {view==='Explora'&&<ExploreView onPlan={setSelected}/>} 
        {view==='Chat'&&<ChatView/>} 
        {view==='Perfil'&&<ProfileView setView={setView}/>} 
        {view==='Ajustes'&&<SettingsView/>}
        {view==='Notificaciones'&&<NotificationsView/>}
        {view==='Crear'&&<CreatePlanView setView={setView}/>} 
      </div>
    </main>
    <BottomNav view={view} setView={setView}/>
    {selected&&<PlanDetail plan={selected} onClose={()=>setSelected(null)}/>} 
  </div>
}
