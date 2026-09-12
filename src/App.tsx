import { useEffect, useState } from 'react';
import { BottomNav, Header, Sidebar } from './components/AppNavigation';
import { PlanDetail } from './components/PlanComponents';
import { createSharedPlan, fetchSharedPlans } from './lib/cloud';
import { acceptPlanInvite, clearInviteFromUrl, inviteCodeFromUrl } from './lib/inviteBackend';
import { fetchUnreadNotificationCount } from './lib/notificationsBackend';
import { createRealPlan, fetchRealPlans } from './lib/realPlansBackend';
import { loadStored, saveStored, storageKeys } from './lib/storage';
import type { ExploreFilter, HomeBrowseMode, Plan, View } from './types';
import { CalendarView } from './views/CalendarView';
import { ChatView } from './views/ChatView';
import { CreatePlanView } from './views/CreatePlanView';
import { ExploreView } from './views/ExploreView';
import { HomeBrowseView } from './views/HomeBrowseView';
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
  const [planReturnView,setPlanReturnView]=useState<View>('Inicio');
  const [createdPlans,setCreatedPlans]=useState<Plan[]>(()=>loadStored(storageKeys.createdPlans,[]));
  const [exploreFilter,setExploreFilter]=useState<ExploreFilter>('near');
  const [exploreCategory,setExploreCategory]=useState<string|null>(null);
  const [homeBrowseMode,setHomeBrowseMode]=useState<HomeBrowseMode>('all');
  const [homeBrowseCategory,setHomeBrowseCategory]=useState<string|null>(null);
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
          setPlanReturnView('Explora');
          setSelected(invitedPlan);
          setView('Plan');
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
    if(view!=='Plan')setSelected(null);
    window.scrollTo({top:0,left:0,behavior:'auto'});
  },[view]);

  const openExplore=(filter:ExploreFilter='near',category:string|null=null)=>{
    setExploreFilter(filter);
    setExploreCategory(category);
    setView('Explora');
  };
  const openHomeBrowse=(mode:HomeBrowseMode,category:string|null=null)=>{
    setHomeBrowseMode(mode);
    setHomeBrowseCategory(category);
    setView('HomeBrowse');
  };
  const openChat=(name?:string)=>{
    setSelected(null);
    setChatTarget(name||null);
    setView('Chat');
  };
  const openPlan=(plan:Plan,returnView:View)=>{
    setPlanReturnView(returnView);
    setSelected(plan);
    setView('Plan');
  };
  const openHomePlan=(plan:Plan)=>openPlan(plan,'Inicio');
  const openHomeBrowsePlan=(plan:Plan)=>openPlan(plan,'HomeBrowse');
  const openExplorePlan=(plan:Plan)=>openPlan(plan,'Explora');
  const closePlan=()=>{
    setSelected(null);
    setView(planReturnView);
  };
  const addCreatedPlan=async(plan:Plan):Promise<boolean>=>{
    setExploreFilter('all');
    setExploreCategory(null);
    try{
      const real=await createRealPlan(plan);
      setCreatedPlans(prev=>mergePlans([real],prev.filter(item=>planKey(item)!==planKey(plan))));
      return true;
    }catch(error){
      console.warn('CONECTA real plan publish unavailable; keeping prototype fallback',error);
      setCreatedPlans(prev=>mergePlans([plan],prev));
      try{
        await createSharedPlan(plan);
        const shared=await fetchSharedPlans();
        setCreatedPlans(local=>mergePlans(shared,local));
      }catch(fallbackError){
        console.warn('CONECTA prototype plan publish failed; local copy kept',fallbackError);
      }
      return false;
    }
  };

  const navigationView=view==='Plan'?planReturnView:view;

  return <div className="app-shell">
    <Sidebar view={view} activeView={navigationView} setView={setView}/>
    <main>
      <Header view={view} setView={setView} unreadNotifications={unreadNotifications}/>
      <div className="content">
        {view==='Inicio'&&<HomeView setView={setView} onPlan={openHomePlan} onBrowse={openHomeBrowse}/>} 
        {view==='HomeBrowse'&&<HomeBrowseView mode={homeBrowseMode} category={homeBrowseCategory} onBack={()=>setView('Inicio')} onPlan={openHomeBrowsePlan} onBrowse={openHomeBrowse}/>} 
        {view==='Explora'&&<ExploreView onPlan={openExplorePlan} extraPlans={createdPlans} initialFilter={exploreFilter} initialCategory={exploreCategory} onChat={openChat}/>} 
        {view==='Chat'&&<ChatView initialContact={chatTarget}/>} 
        {view==='Perfil'&&<ProfileView setView={setView}/>} 
        {view==='Ajustes'&&<SettingsView/>}
        {view==='Notificaciones'&&<NotificationsView onUnreadCountChange={setUnreadNotifications} onOpenPlanChat={openChat}/>} 
        {view==='Crear'&&<CreatePlanView setView={setView} onCreate={addCreatedPlan}/>} 
        {view==='Calendario'&&<CalendarView setView={setView}/>} 
        {view==='Plan'&&selected&&<PlanDetail plan={selected} onClose={closePlan} onOpenChat={openChat} standalone/>}
      </div>
    </main>
    <BottomNav view={view} activeView={navigationView} setView={setView}/>
  </div>
}
