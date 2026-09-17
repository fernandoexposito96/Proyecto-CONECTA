import { supabase } from './supabase';

const activeStatuses=['attending','requested','waitlist','attended'];
const inactiveStatuses=['interested','declined','no_show'];
const seatStatuses=['attending','attended'];

async function targetJoinStatus(planId:string):Promise<'attending'|'waitlist'>{
  const {data:plan,error:planError}=await supabase.from('plans').select('max_people,status').eq('id',planId).maybeSingle();
  if(planError)throw planError;
  if(!plan)throw new Error('El plan ya no está disponible.');
  const maxPeople=Number(plan.max_people||0);
  if(!maxPeople)return 'attending';
  const {count,error:countError}=await supabase.from('plan_members').select('user_id',{count:'exact',head:true}).eq('plan_id',planId).in('status',seatStatuses);
  if(countError)throw countError;
  return (count||0)>=maxPeople?'waitlist':'attending';
}

export async function joinPlan(planId:string){
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('Necesitas iniciar sesión para unirte a un plan.');

  const {data:existing,error:selectError}=await supabase
    .from('plan_members')
    .select('status')
    .eq('plan_id',planId)
    .eq('user_id',user.id)
    .maybeSingle();
  if(selectError)throw selectError;

  const currentStatus=existing?String(existing.status||''):'';
  if(currentStatus&&activeStatuses.includes(currentStatus))return currentStatus;
  const nextStatus=await targetJoinStatus(planId);

  if(currentStatus&&inactiveStatuses.includes(currentStatus)){
    const {data:updated,error:updateError}=await supabase
      .from('plan_members')
      .update({status:nextStatus,role:'participant'})
      .eq('plan_id',planId)
      .eq('user_id',user.id)
      .select('status')
      .single();
    if(updateError)throw updateError;
    return String(updated.status||nextStatus);
  }

  const {data:inserted,error}=await supabase
    .from('plan_members')
    .insert({plan_id:planId,user_id:user.id,status:nextStatus,role:'participant'})
    .select('status')
    .single();
  if(error)throw error;
  return String(inserted.status||nextStatus);
}

export async function leavePlan(planId:string){
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)throw new Error('Necesitas iniciar sesión para salir de un plan.');
  const {error}=await supabase
    .from('plan_members')
    .delete()
    .eq('plan_id',planId)
    .eq('user_id',user.id);
  if(error)throw error;
}

export async function getPlanMembershipStatus(planId:string):Promise<string|null>{
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)return null;
  const {data,error}=await supabase
    .from('plan_members')
    .select('status')
    .eq('plan_id',planId)
    .eq('user_id',user.id)
    .maybeSingle();
  if(error)throw error;
  return data&&activeStatuses.includes(String(data.status||''))?String(data.status):null;
}

export async function isPlanJoined(planId:string):Promise<boolean>{
  return Boolean(await getPlanMembershipStatus(planId));
}

export async function countMyPlanMemberships():Promise<number>{
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError)throw userError;
  if(!user)return 0;
  const {count,error}=await supabase
    .from('plan_members')
    .select('plan_id',{count:'exact',head:true})
    .eq('user_id',user.id)
    .in('status',activeStatuses);
  if(error)throw error;
  return count||0;
}
