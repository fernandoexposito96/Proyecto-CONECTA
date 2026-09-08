import { useEffect, useState } from 'react';
import { BottomNav, Header, Sidebar } from './components/AppNavigation';
import { PlanDetail } from './components/PlanComponents';
import { createSharedPlan, fetchSharedPlans } from './lib/cloud';
import { acceptPlanInvite, clearInviteFromUrl, inviteCodeFromUrl } from './lib/inviteBackend';
import { fetchUnreadNotificationCount } from './lib/notificationsBackend';
import { fetchRealPlans } from './lib/realPlansBackend';
import { loadStored, saveStored, storageKeys } from './lib/storage';
import type { ExploreFilter, Plan, View } from './types';
import { ChatView } from './views/ChatView';
import { CreatePlanView } from './views/CreatePlanView';
import { ExploreView } from './views/ExploreView';
import { HomeView } from './views/HomeView';
import { NotificationsView } from './views/NotificationsView';
import { ProfileView } from './views/ProfileView';
import { SettingsView } from './views/SettingsView';

const planKey=(plan:Plan)=>plan.backendId?`backend:${plan.backendId}`:`${plan.title}|${plan.time}|${plan.place}`;
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
  const [unreadNotifications,setUnreadNotifications]=useState(0);

  useEffect(()=>{saveStored(storageKeys.createdPlans,createdPlans)},[createdPlans]);

  useEffect(()=>{
    let active=true;
    void Promise.allSettled([fetchRealPlans(),fetchSharedPlans()]).then(results=>{
      if(!active)return;
      const real=results[0].status==='fulfilled'?results[0].value:[];
      const shared=results[1].status==='fulfilled'?results[1].value:[];
      if(results[0].status==='rejected')console.warn('CONECTA real plans load failed; demo/shared plans kept',results[0].reason);
      if(results[1].status==='rejected')console.warn('CONECTA shared plans load failed; local demo remains available',results[1].reason);
      setCreatedPlans(local=>mergePlans(real,mergePlans(shared,local)));
    });
    return ()=>{active=false};
  },[]);

  useEffect(()=>{
    const code=inviteCodeFromUrl();
    if(!code)return;
    let active=true;
    void acceptPlanInvite(code)
      .then(async planId=>{
        const real=await fetchRealPlans();
        if(!active)return;
        setCreatedPlans(local=>mergePlans(real,local));
        const invitedPlan=real.find(plan=>plan.backendId===planId);
        if(invitedPlan){
          setExploreFilter('all');
          setExploreCategory(null);
          setView('Explora');
          setSelected(invitedPlan);
        }
        clearInviteFromUrl();
      })
      .catch(error=>console.warn('CONECTA invite acceptance failed; invite kept in URL for retry',error));
    return ()=>{active=false};
  },[]);

  useEffect(()=>{
    let active=true;
    void fetchUnreadNotificationCount()
      .then(count=>{if(active)setUnreadNotifications(count)})
      .catch(error=>console.warn('CONECTA unread notifications unavailable; indicator hidden',error));
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
      <Header view={view} setView={setView} unreadNotifications={unreadNotifications}/>
      <div className="content">
        {view==='Inicio'&&<HomeView setView={setView} onPlan={setSelected} onExplore={openExplore}/>} 
        {view==='Explora'&&<ExploreView onPlan={setSelected} extraPlans={createdPlans} initialFilter={exploreFilter} initialCategory={exploreCategory} onChat={openChat}/>} 
        {view==='Chat'&&<ChatView initialContact={chatTarget}/>} 
        {view==='Perfil'&&<ProfileView setView={setView}/>} 
        {view==='Ajustes'&&<SettingsView/>}
        {view==='Notificaciones'&&<NotificationsView onUnreadCountChange={setUnreadNotifications}/>} 
        {view==='Crear'&&<CreatePlanView setView={setView} onCreate={addCreatedPlan}/>} 
      </div>
    </main>
    <BottomNav view={view} setView={setView}/>
    {selected&&<PlanDetail plan={selected} onClose={()=>setSelected(null)}/>} 
  </div>
}