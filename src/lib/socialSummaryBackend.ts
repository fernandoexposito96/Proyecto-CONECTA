import { supabase } from './supabase';

export type WeeklyPlanSummary={
  id:string;
  title:string;
  startsAt:string;
  category:string;
  location:string;
};

export type SocialSummary={
  attendedThisWeek:number;
  attendedLast7Days:number;
  streakWeeks:number;
  topCategory:string|null;
  nextPlan:WeeklyPlanSummary|null;
  weekPlans:WeeklyPlanSummary[];
};

function startOfWeek(date:Date){
  const copy=new Date(date);
  const day=(copy.getDay()+6)%7;
  copy.setHours(0,0,0,0);
  copy.setDate(copy.getDate()-day);
  return copy;
}

function weekKey(date:Date){
  return startOfWeek(date).toISOString().slice(0,10);
}

export async function loadSocialSummary():Promise<SocialSummary>{
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)return {attendedThisWeek:0,attendedLast7Days:0,streakWeeks:0,topCategory:null,nextPlan:null,weekPlans:[]};

  const {data:memberships,error:membershipError}=await supabase
    .from('plan_members')
    .select('plan_id,status,checked_in_at,joined_at')
    .eq('user_id',user.id);
  if(membershipError)throw membershipError;

  const planIds=[...new Set((memberships||[]).map(row=>String(row.plan_id||'')).filter(Boolean))];
  if(!planIds.length)return {attendedThisWeek:0,attendedLast7Days:0,streakWeeks:0,topCategory:null,nextPlan:null,weekPlans:[]};

  const {data:plans,error:planError}=await supabase
    .from('plans')
    .select('id,title,starts_at,category,location_name,status')
    .in('id',planIds);
  if(planError)throw planError;

  const planById=new Map((plans||[]).map(row=>[String(row.id||''),row]));
  const now=new Date();
  const weekStart=startOfWeek(now);
  const nextWeekStart=new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate()+7);
  const sevenDaysAgo=new Date(now.getTime()-7*24*60*60*1000);

  const attendanceDates:Date[]=[];
  const categoryCounts=new Map<string,number>();
  for(const membership of memberships||[]){
    const plan=planById.get(String(membership.plan_id||''));
    const attended=String(membership.status||'')==='attended'||Boolean(membership.checked_in_at);
    if(!attended)continue;
    const rawDate=typeof membership.checked_in_at==='string'?membership.checked_in_at:typeof plan?.starts_at==='string'?plan.starts_at:null;
    if(!rawDate)continue;
    const date=new Date(rawDate);
    if(Number.isNaN(date.getTime()))continue;
    attendanceDates.push(date);
    const category=String(plan?.category||'Plan');
    categoryCounts.set(category,(categoryCounts.get(category)||0)+1);
  }

  const attendedThisWeek=attendanceDates.filter(date=>date>=weekStart&&date<nextWeekStart).length;
  const attendedLast7Days=attendanceDates.filter(date=>date>=sevenDaysAgo&&date<=now).length;
  const attendedWeeks=new Set(attendanceDates.map(weekKey));
  let streakWeeks=0;
  const cursor=startOfWeek(now);
  while(attendedWeeks.has(weekKey(cursor))){
    streakWeeks+=1;
    cursor.setDate(cursor.getDate()-7);
  }
  const topCategory=[...categoryCounts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||null;

  const upcoming=(memberships||[])
    .filter(row=>['attending','requested','waitlist'].includes(String(row.status||'')))
    .map(row=>planById.get(String(row.plan_id||'')))
    .filter((row):row is NonNullable<typeof row>=>Boolean(row&&typeof row.starts_at==='string'))
    .map(row=>({
      id:String(row.id||''),
      title:String(row.title||'Plan CONECTA'),
      startsAt:String(row.starts_at),
      category:String(row.category||'Plan'),
      location:String(row.location_name||'Lugar por confirmar'),
    }))
    .filter(plan=>new Date(plan.startsAt)>now)
    .sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));

  const weekPlans=upcoming.filter(plan=>{
    const date=new Date(plan.startsAt);
    return date>=weekStart&&date<nextWeekStart;
  });

  return {
    attendedThisWeek,
    attendedLast7Days,
    streakWeeks,
    topCategory,
    nextPlan:upcoming[0]||null,
    weekPlans,
  };
}
