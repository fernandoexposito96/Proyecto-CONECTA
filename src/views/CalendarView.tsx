import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, Clock3, MapPin } from 'lucide-react';
import { loadSocialSummary, type SocialSummary } from '../lib/socialSummaryBackend';
import type { View } from '../types';

const emptySummary:SocialSummary={attendedThisWeek:0,attendedLast7Days:0,streakWeeks:0,topCategory:null,nextPlan:null,weekPlans:[],upcomingPlans:[]};

function formatDate(value:string){
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return 'Fecha por confirmar';
  return new Intl.DateTimeFormat('es-ES',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(date);
}

export function CalendarView({setView}:{setView:(view:View)=>void}){
  const [summary,setSummary]=useState<SocialSummary>(emptySummary);
  const [weekOnly,setWeekOnly]=useState(true);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{
    let active=true;
    void loadSocialSummary()
      .then(value=>{if(active){setSummary(value);setError('')}})
      .catch(loadError=>{
        console.warn('CONECTA calendar sync failed',loadError);
        if(active)setError('No se ha podido actualizar tu calendario real.');
      })
      .finally(()=>{if(active)setLoading(false)});
    return ()=>{active=false};
  },[]);

  const items=useMemo(()=>weekOnly?summary.weekPlans:summary.upcomingPlans,[summary,weekOnly]);

  return <div className="page calendar-page">
    <div className="calendar-head"><button type="button" aria-label="Volver a Inicio" onClick={()=>setView('Inicio')}><ChevronLeft/></button><div><h1>Calendario</h1><p>Tus planes confirmados y próximos</p></div><CalendarDays/></div>
    <div className="calendar-mode"><button type="button" className={weekOnly?'active':''} onClick={()=>setWeekOnly(true)}>Solo esta semana</button><button type="button" className={!weekOnly?'active':''} onClick={()=>setWeekOnly(false)}>Todos los próximos</button></div>
    {loading&&<div className="empty-state">Actualizando calendario…</div>}
    {!loading&&error&&<div className="notification-status" role="status">{error}</div>}
    {!loading&&!error&&(items.length?<div className="calendar-list">{items.map(plan=><article key={plan.id}><div className="calendar-date"><Clock3/><span>{formatDate(plan.startsAt)}</span></div><strong>{plan.title}</strong><small>{plan.category}</small><p><MapPin/> {plan.location}</p></article>)}</div>:<div className="empty-state"><strong>{weekOnly?'No tienes planes esta semana':'No tienes próximos planes sincronizados'}</strong><span>Cuando te apuntes a un plan real aparecerá aquí automáticamente.</span></div>)}
  </div>;
}
