import type { Plan } from '../types';
import { supabase } from './supabase';

type RealPlanRow={
  id:string;
  title:string;
  category:string|null;
  location_name:string|null;
  starts_at:string|null;
  max_people:number|null;
  image_url:string|null;
  visibility:string|null;
  share_slug:string|null;
};

const fallbackImage='./assets/images/photo-1529156069898-49953e39b3ac.jpg';

function formatStartsAt(value:string|null){
  if(!value)return 'Fecha por confirmar';
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return 'Fecha por confirmar';
  return new Intl.DateTimeFormat('es-ES',{
    weekday:'short',
    day:'2-digit',
    month:'short',
    hour:'2-digit',
    minute:'2-digit',
  }).format(date);
}

export async function fetchRealPlans():Promise<Plan[]>{
  const {data,error}=await supabase
    .from('plans')
    .select('id,title,category,location_name,starts_at,max_people,image_url,visibility,share_slug')
    .in('status',['published','full'])
    .order('starts_at',{ascending:true,nullsFirst:false})
    .limit(100);
  if(error)throw error;

  return ((data||[]) as RealPlanRow[]).map(row=>({
    backendId:row.id,
    title:row.title,
    image:row.image_url||fallbackImage,
    time:formatStartsAt(row.starts_at),
    startsAt:row.starts_at||undefined,
    place:row.location_name||'Lugar por confirmar',
    distance:'Cerca de ti',
    spots:row.max_people?`${row.max_people} plazas`:'Plazas abiertas',
    category:row.category||'Plan',
    visibility:row.visibility==='connections'?'Solo conexiones':'Todos',
    shareSlug:row.share_slug||undefined,
  }));
}
