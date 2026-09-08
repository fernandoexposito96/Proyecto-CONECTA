import { supabase } from './supabase';

export type ResolvedPlanInvite={
  code:string;
  planId:string;
  title:string;
  locationName:string;
  startsAt:string|null;
  imageUrl:string|null;
  category:string;
};

export function inviteCodeFromUrl(){
  return new URL(window.location.href).searchParams.get('invite')?.trim()||'';
}

export async function resolvePlanInvite(code:string):Promise<ResolvedPlanInvite|null>{
  const clean=code.trim();
  if(!clean)return null;
  const {data,error}=await supabase.rpc('resolve_plan_invite',{p_code:clean});
  if(error)throw error;
  const row=Array.isArray(data)?data[0]:null;
  if(!row)return null;
  return {
    code:String(row.invite_code||clean),
    planId:String(row.plan_id||''),
    title:String(row.title||'Plan CONECTA'),
    locationName:String(row.location_name||'Lugar por confirmar'),
    startsAt:typeof row.starts_at==='string'?row.starts_at:null,
    imageUrl:typeof row.image_url==='string'?row.image_url:null,
    category:String(row.category||'Plan'),
  };
}

export async function acceptPlanInvite(code:string){
  const clean=code.trim();
  if(!clean)throw new Error('Enlace de invitación no válido.');
  const {data,error}=await supabase.rpc('accept_plan_invite',{p_code:clean});
  if(error)throw error;
  return String(data||'');
}

export function clearInviteFromUrl(){
  const url=new URL(window.location.href);
  url.searchParams.delete('invite');
  window.history.replaceState({},'',`${url.pathname}${url.search}${url.hash}`);
}
