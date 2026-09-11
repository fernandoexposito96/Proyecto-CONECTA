import type { Plan } from '../types';
import { supabase } from './supabase';

type RealPlanRow={
  id:string;
  creator_id:string;
  title:string;
  category:string|null;
  location_name:string|null;
  starts_at:string|null;
  max_people:number|null;
  image_url:string|null;
  visibility:string|null;
  share_slug:string|null;
};

type MemberRow={plan_id:string;user_id:string;status:string|null};
type ProfileRow={id:string;display_name:string|null;username:string|null;avatar_url:string|null;organizer_verified:boolean|null};

const fallbackImage='./assets/images/photo-1529156069898-49953e39b3ac.jpg';
const activeStatuses=new Set(['attending','requested','waitlist','attended']);

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

function basePlan(row:RealPlanRow):Plan{
  return {
    backendId:row.id,
    creatorId:row.creator_id,
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
  };
}

export async function fetchRealPlans():Promise<Plan[]>{
  const {data,error}=await supabase
    .from('plans')
    .select('id,creator_id,title,category,location_name,starts_at,max_people,image_url,visibility,share_slug')
    .in('status',['published','full'])
    .order('starts_at',{ascending:true,nullsFirst:false})
    .limit(100);
  if(error)throw error;

  const rows=(data||[]) as RealPlanRow[];
  if(!rows.length)return [];
  const planIds=rows.map(row=>row.id);

  let members:MemberRow[]=[];
  const {data:memberData,error:memberError}=await supabase
    .from('plan_members')
    .select('plan_id,user_id,status')
    .in('plan_id',planIds);
  if(memberError)console.warn('CONECTA plan members unavailable; plan data kept',memberError);
  else members=(memberData||[]) as MemberRow[];

  const profileIds=[...new Set([
    ...rows.map(row=>row.creator_id).filter(Boolean),
    ...members.filter(row=>activeStatuses.has(String(row.status||''))).map(row=>row.user_id).filter(Boolean),
  ])];
  const profilesById=new Map<string,ProfileRow>();
  if(profileIds.length){
    const {data:profileData,error:profileError}=await supabase
      .from('profiles')
      .select('id,display_name,username,avatar_url,organizer_verified')
      .in('id',profileIds);
    if(profileError)console.warn('CONECTA plan profiles unavailable; generic labels kept',profileError);
    else for(const profile of (profileData||[]) as ProfileRow[])profilesById.set(profile.id,profile);
  }

  return rows.map(row=>{
    const organizer=profilesById.get(row.creator_id);
    const activeMembers=members.filter(member=>member.plan_id===row.id&&activeStatuses.has(String(member.status||'')));
    const participantProfiles=activeMembers
      .map(member=>profilesById.get(member.user_id))
      .filter((profile):profile is ProfileRow=>Boolean(profile));
    return {
      ...basePlan(row),
      organizerName:String(organizer?.display_name||organizer?.username||'Organizador CONECTA'),
      organizerAvatar:organizer?.avatar_url||undefined,
      organizerVerified:Boolean(organizer?.organizer_verified),
      participantNames:participantProfiles.map(profile=>String(profile.display_name||profile.username||'Usuario')),
      participantAvatars:participantProfiles.map(profile=>profile.avatar_url||'').filter(Boolean),
      participantCount:activeMembers.length,
    };
  });
}

export async function createRealPlan(plan:Plan):Promise<Plan>{
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('Necesitas iniciar sesión para publicar un plan.');
  if(!plan.startsAt)throw new Error('Selecciona una fecha y hora válidas para publicar el plan.');

  const maxPeople=Math.max(2,Math.min(50,Number.parseInt(plan.spots,10)||6));
  const visibility=plan.visibility==='Solo conexiones'?'connections':'public';
  const {data,error}=await supabase
    .from('plans')
    .insert({
      creator_id:user.id,
      title:plan.title,
      description:'Plan creado desde CONECTA.',
      category:plan.category,
      location_name:plan.place,
      starts_at:plan.startsAt,
      max_people:maxPeople,
      image_url:plan.image,
      visibility,
      status:'published',
      meeting_safety:'public_place',
    })
    .select('id,creator_id,title,category,location_name,starts_at,max_people,image_url,visibility,share_slug')
    .single();
  if(error)throw error;
  const row=data as RealPlanRow;
  const created=basePlan(row);
  created.organizerName='Tú';
  created.participantNames=[];
  created.participantAvatars=[];
  created.participantCount=0;
  return created;
}
