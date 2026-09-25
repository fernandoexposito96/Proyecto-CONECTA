import type { Plan } from '../types';
import { supabase } from './supabase';

type RealPlanRow={
  id:string;
  creator_id:string;
  title:string;
  category:string|null;
  location_name:string|null;
  latitude:number|null;
  longitude:number|null;
  starts_at:string|null;
  max_people:number|null;
  image_url:string|null;
  visibility:string|null;
  share_slug:string|null;
  description?:string|null;
};

type MemberRow={plan_id:string;user_id:string;status:string|null};
type ProfileRow={id:string;display_name:string|null;username:string|null;avatar_url:string|null;organizer_verified:boolean|null};

const fallbackImage='./assets/images/photo-1529156069898-49953e39b3ac.jpg';
const activeStatusList=['attending','attended'] as const;
const activeStatuses=new Set<string>(activeStatusList);
const startsAtFormatter=new Intl.DateTimeFormat('es-ES',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
const MAX_TITLE_LENGTH=120;
const MAX_DESCRIPTION_LENGTH=2000;
const MAX_LOCATION_LENGTH=180;
const MAX_CATEGORY_LENGTH=80;

function formatStartsAt(value:string|null){if(!value)return 'Fecha por confirmar';const date=new Date(value);if(Number.isNaN(date.getTime()))return 'Fecha por confirmar';return startsAtFormatter.format(date)}
function validCoordinate(value:unknown,min:number,max:number){if((typeof value!=='number'&&typeof value!=='string')||(typeof value==='string'&&!value.trim()))return undefined;const number=typeof value==='number'?value:Number(value);return Number.isFinite(number)&&number>=min&&number<=max?number:undefined}
function cleanRequired(value:unknown,label:string,max:number){const clean=String(value??'').trim();if(!clean)throw new Error(`${label} es obligatorio.`);if(clean.length>max)throw new Error(`${label} no puede superar ${max} caracteres.`);return clean;}
function cleanOptional(value:unknown,max:number){const clean=String(value??'').trim();if(clean.length>max)throw new Error(`El texto no puede superar ${max} caracteres.`);return clean;}
function basePlan(row:RealPlanRow):Plan{
 const latitude=validCoordinate(row.latitude,-90,90);const longitude=validCoordinate(row.longitude,-180,180);
 return {backendId:row.id,creatorId:row.creator_id,title:row.title,image:row.image_url||fallbackImage,time:formatStartsAt(row.starts_at),startsAt:row.starts_at||undefined,place:row.location_name||'Lugar por confirmar',distance:latitude!==undefined&&longitude!==undefined?'Ubicación disponible':'Ubicación por confirmar',spots:row.max_people?`${row.max_people} plazas`:'Plazas abiertas',category:row.category||'Plan',latitude,longitude,visibility:row.visibility==='connections'?'Solo conexiones':'Todos',shareSlug:row.share_slug||undefined,description:row.description||undefined};
}
const planColumns='id,creator_id,title,description,category,location_name,latitude,longitude,starts_at,max_people,image_url,visibility,share_slug';
export async function fetchRealPlans():Promise<Plan[]>{
 const now=new Date().toISOString();const {data,error}=await supabase.from('plans').select(planColumns).in('status',['published','full']).gte('starts_at',now).order('starts_at',{ascending:true,nullsFirst:false}).limit(100);if(error)throw error;
 const rows=(data||[]) as unknown as RealPlanRow[];if(!rows.length)return [];const planIds=rows.map(row=>row.id);let members:MemberRow[]=[];
 const {data:memberData,error:memberError}=await supabase.from('plan_members').select('plan_id,user_id,status').in('plan_id',planIds).in('status',[...activeStatusList]);if(memberError)console.warn('CONECTA plan members unavailable; plan data kept',memberError);else members=(memberData||[]) as MemberRow[];
 const activeMembersByPlan=new Map<string,MemberRow[]>();for(const member of members){if(!activeStatuses.has(String(member.status||'')))continue;const list=activeMembersByPlan.get(member.plan_id)||[];list.push(member);activeMembersByPlan.set(member.plan_id,list)}
 const profileIds=[...new Set([...rows.map(row=>row.creator_id).filter(Boolean),...members.map(row=>row.user_id).filter(Boolean)])];const profilesById=new Map<string,ProfileRow>();
 if(profileIds.length){const {data:profileData,error:profileError}=await supabase.from('profiles').select('id,display_name,username,avatar_url,organizer_verified').in('id',profileIds);if(profileError)console.warn('CONECTA plan profiles unavailable; generic labels kept',profileError);else for(const profile of (profileData||[]) as ProfileRow[])profilesById.set(profile.id,profile)}
 return rows.map(row=>{const organizer=profilesById.get(row.creator_id);const activeMembers=activeMembersByPlan.get(row.id)||[];const participantProfiles=activeMembers.map(member=>profilesById.get(member.user_id)).filter((profile):profile is ProfileRow=>Boolean(profile));return {...basePlan(row),organizerName:String(organizer?.display_name||organizer?.username||'Organizador CONECTA'),organizerAvatar:organizer?.avatar_url||undefined,organizerVerified:Boolean(organizer?.organizer_verified),participantNames:participantProfiles.map(profile=>String(profile.display_name||profile.username||'Usuario')),participantAvatars:participantProfiles.map(profile=>profile.avatar_url||'').filter(Boolean),participantCount:activeMembers.length}});
}
export async function createRealPlan(plan:Plan):Promise<Plan>{
 const {data:{user},error:userError}=await supabase.auth.getUser();if(userError)throw userError;if(!user)throw new Error('Necesitas iniciar sesión para publicar un plan.');
 const title=cleanRequired(plan.title,'El título',MAX_TITLE_LENGTH);const category=cleanRequired(plan.category,'La categoría',MAX_CATEGORY_LENGTH);const place=cleanRequired(plan.place,'El lugar',MAX_LOCATION_LENGTH);const description=cleanOptional(plan.description,MAX_DESCRIPTION_LENGTH)||'Plan creado desde CONECTA.';
 if(!plan.startsAt)throw new Error('Selecciona una fecha y hora válidas para publicar el plan.');const startsAt=new Date(plan.startsAt);if(Number.isNaN(startsAt.getTime()))throw new Error('Selecciona una fecha y hora válidas para publicar el plan.');if(startsAt.getTime()<=Date.now())throw new Error('La fecha del plan debe estar en el futuro.');
 const maxPeople=Math.max(2,Math.min(50,Number.parseInt(plan.spots,10)||6));const visibility=plan.visibility==='Solo conexiones'?'connections':'public';const latitude=validCoordinate(plan.latitude,-90,90);const longitude=validCoordinate(plan.longitude,-180,180);
 const {data,error}=await supabase.from('plans').insert({creator_id:user.id,title,description,category,location_name:place,latitude:latitude??null,longitude:longitude??null,starts_at:startsAt.toISOString(),max_people:maxPeople,image_url:plan.image,visibility,status:'published',meeting_safety:'public_place'}).select(planColumns).single();if(error)throw error;
 const created=basePlan(data as unknown as RealPlanRow);created.organizerName='Tú';created.participantNames=[];created.participantAvatars=[];created.participantCount=0;return created;
}
