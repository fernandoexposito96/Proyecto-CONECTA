import { supabase } from './supabase';

const activeStatuses=['attending','requested','waitlist','attended'];

export async function joinPlan(planId:string){
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('Necesitas iniciar sesión para unirte a un plan.');

  const {data:existing,error:selectError}=await supabase
    .from('plan_members')
    .select('plan_id')
    .eq('plan_id',planId)
    .eq('user_id',user.id)
    .maybeSingle();
  if(selectError)throw selectError;

  if(existing){
    const {error}=await supabase.from('plan_members').update({status:'attending'}).eq('plan_id',planId).eq('user_id',user.id);
    if(error)throw error;
    return;
  }
  const {error}=await supabase.from('plan_members').insert({plan_id:planId,user_id:user.id,status:'attending'});
  if(error)throw error;
}

export async function leavePlan(planId:string){
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('Necesitas iniciar sesión para salir de un plan.');
  const {error}=await supabase.from('plan_members').delete().eq('plan_id',planId).eq('user_id',user.id);
  if(error)throw error;
}

export async function isPlanJoined(planId:string):Promise<boolean>{
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)return false;
  const {data,error}=await supabase
    .from('plan_members')
    .select('status')
    .eq('plan_id',planId)
    .eq('user_id',user.id)
    .maybeSingle();
  if(error)throw error;
  return Boolean(data&&activeStatuses.includes(String(data.status||'')));
}
