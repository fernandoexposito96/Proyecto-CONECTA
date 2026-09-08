import { useEffect, useState } from 'react';
import { BottomNav, Header, Sidebar } from './components/AppNavigation';
import { PlanDetail } from './components/PlanComponents';
import { createSharedPlan, fetchSharedPlans } from './lib/cloud';
import { loadStored, saveStored, storageKeys } from './lib/storage';
import type { ExploreFilter, Plan, View } from './types';
import { ChatView } from './views/ChatView';
import { CreatePlanView } from './views/CreatePlanView';
import { ExploreView } from './views/ExploreView';
import { HomeView } from './views/HomeView';
import { NotificationsView } from './views/NotificationsView';
import { ProfileView } from './views/ProfileView';
import { SettingsView } from './views/SettingsView';

const planKey=(plan:Plan)=>`${plan.title}|${plan.time}|${plan.place}`;
const mergePlans=(primary:Plan[],secondary:Plan[])=>{
  const seen=new Set<string>();
  return [...primary,...secondary].filter(plan=>{
    const key=planKey(plan);
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  });
};

export default function App(){
  const [view,setView]=useState<View>('Inicio');
  const [selected,setSelected]=useState<Plan|null>(null);
  const [createdPlans,setCreatedPlans]=useState<Plan[]>(()=>loadStored(storageKeys.createdPlans,[]));
  const [exploreFilter,setExploreFilter]=useState<ExploreFilter>('near');
  const [exploreCategory,setExploreCategory]=useState<string|null>(null);
  const [chatTarget,setChatTarget]=useState<string|null>(null);

  useEffect(()=>{saveStored(storageKeys.createdPlans,createdPlans)},[createdPlans]);

  useEffect(()=>{
    let active=true;
    void fetchSharedPlans()
      .then(shared=>{if(active)setCreatedPlans(local=>mergePlans(shared,local))})
      .catch(error=>console.warn('CONECTA shared plans load failed; local demo remains available',error));
    return ()=>{active=false};
  },[]);

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
  const addCreatedPlan=async(plan:Plan):Promise<boolean>=>{
    setCreatedPlans(prev=>mergePlans([plan],prev));
    setExploreFilter('all');
    setExploreCategory(null);
    try{
      await createSharedPlan(plan);
      const shared=await fetchSharedPlans();
      setCreatedPlans(local=>mergePlans(shared,local));
      return true;
    }catch(error){
      console.warn('CONECTA shared plan publish failed; local copy kept',error);
      return false;
    }
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
