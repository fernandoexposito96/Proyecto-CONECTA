import { supabase } from './supabase';

export async function joinPlan(planId:string){
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('Necesitas iniciar sesión para unirte a un plan.');
  const {error}=await supabase.from('plan_attendees').insert({plan_id:planId,user_id:user.id});
  if(error&&error.code!=='23505')throw error;
}

export async function leavePlan(planId:string){
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('Necesitas iniciar sesión para salir de un plan.');
  const {error}=await supabase.from('plan_attendees').delete().eq('plan_id',planId).eq('user_id',user.id);
  if(error)throw error;
}

export async function isPlanJoined(planId:string):Promise<boolean>{
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)return false;
  const {data,error}=await supabase
    .from('plan_attendees')
    .select('plan_id')
    .eq('plan_id',planId)
    .eq('user_id',user.id)
    .maybeSingle();
  if(error)throw error;
  return Boolean(data);
}
