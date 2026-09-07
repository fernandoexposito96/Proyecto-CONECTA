import type { ExploreFilter, Plan } from '../types';

export type PlanDraft = {
  title: string;
  place: string;
  when: string;
  spots: string;
  category: string;
  image: string;
};

export type ExplorePlanOptions = {
  timeFilter: ExploreFilter;
  category: string | null;
  query: string;
  sortAsc: boolean;
};

export function normalizeSpots(value:string){
  const parsed=Number(value);
  if(!Number.isFinite(parsed))return 2;
  return Math.min(50,Math.max(2,Math.trunc(parsed)));
}

export function createPlanFromDraft(draft:PlanDraft):Plan|null{
  const title=draft.title.trim();
  const place=draft.place.trim();
  const time=draft.when.trim();
  if(!title||!place||!time)return null;

  return {
    title,
    place,
    time,
    spots:`${normalizeSpots(draft.spots)} plazas`,
    distance:'0 km',
    category:draft.category,
    image:draft.image,
  };
}

export function hourFromPlanTime(time:string):number|null{
  const match=time.match(/(?:^|\D)(\d{1,2}):(\d{2})(?:\D|$)/);
  if(!match)return null;
  const hour=Number(match[1]);
  const minute=Number(match[2]);
  if(!Number.isInteger(hour)||!Number.isInteger(minute)||hour<0||hour>23||minute<0||minute>59)return null;
  return hour;
}

function distanceValue(distance:string){
  const parsed=parseFloat(distance);
  return Number.isFinite(parsed)?parsed:Number.POSITIVE_INFINITY;
}

export function filterExplorePlans(items:Plan[],options:ExplorePlanOptions):Plan[]{
  const q=options.query.trim().toLocaleLowerCase('es');
  const filtered=items.filter(plan=>{
    if(options.category&&plan.category!==options.category)return false;
    if(q&&!`${plan.title} ${plan.place} ${plan.category}`.toLocaleLowerCase('es').includes(q))return false;

    const hour=hourFromPlanTime(plan.time);
    if(options.timeFilter==='today')return plan.time.startsWith('Hoy');
    if(options.timeFilter==='afternoon')return plan.time.startsWith('Hoy')&&hour!==null&&hour>=12&&hour<20;
    if(options.timeFilter==='tonight')return plan.time.startsWith('Hoy')&&hour!==null&&hour>=20;
    if(options.timeFilter==='weekend')return /\b(?:Vie|Sáb|Dom)\b/.test(plan.time);
    return true;
  });

  const descending=options.timeFilter==='all'&&!options.sortAsc;
  return [...filtered].sort((a,b)=>descending?distanceValue(b.distance)-distanceValue(a.distance):distanceValue(a.distance)-distanceValue(b.distance));
}
