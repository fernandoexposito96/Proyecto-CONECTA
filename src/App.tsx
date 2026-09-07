import { useEffect, useState } from 'react';
import { BottomNav, Header, Sidebar } from './components/AppNavigation';
import { PlanDetail } from './components/PlanComponents';
import { loadStored, saveStored, storageKeys } from './lib/storage';
import type { ExploreFilter, Plan, View } from './types';
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
  const [createdPlans,setCreatedPlans]=useState<Plan[]>(()=>loadStored(storageKeys.createdPlans,[]));
  const [exploreFilter,setExploreFilter]=useState<ExploreFilter>('near');
  const [exploreCategory,setExploreCategory]=useState<string|null>(null);
  const [chatTarget,setChatTarget]=useState<string|null>(null);

  useEffect(()=>{saveStored(storageKeys.createdPlans,createdPlans)},[createdPlans]);

  useEffect(()=>{
    setSelected(null);
    window.scrollTo({top:0,left:0,behavior:'auto'});
  },[view]);

  const openExplore=(filter:ExploreFilter='near',category:string|null=null)=>{
    setExploreFilter(filter);
    setExploreCategory(category);
    setView('Explora');
  };
  const openChat=(name?:string)=>{
    setChatTarget(name||null);
    setView('Chat');
  };
  const addCreatedPlan=(plan:Plan)=>{
    setCreatedPlans(prev=>[plan,...prev.filter(item=>item.title!==plan.title)]);
    setExploreFilter('all');
    setExploreCategory(null);
  };

  return <div className="app-shell">
    <Sidebar view={view} setView={setView}/>
    <main>
      <Header view={view} setView={setView}/>
      <div className="content">
        {view==='Inicio'&&<HomeView setView={setView} onPlan={setSelected} onExplore={openExplore}/>} 
        {view==='Explora'&&<ExploreView onPlan={setSelected} extraPlans={createdPlans} initialFilter={exploreFilter} initialCategory={exploreCategory} onChat={openChat}/>} 
        {view==='Chat'&&<ChatView initialContact={chatTarget}/>} 
        {view==='Perfil'&&<ProfileView setView={setView}/>} 
        {view==='Ajustes'&&<SettingsView/>}
        {view==='Notificaciones'&&<NotificationsView/>}
        {view==='Crear'&&<CreatePlanView setView={setView} onCreate={addCreatedPlan}/>} 
      </div>
    </main>
    <BottomNav view={view} setView={setView}/>
    {selected&&<PlanDetail plan={selected} onClose={()=>setSelected(null)}/>} 
  </div>
}
