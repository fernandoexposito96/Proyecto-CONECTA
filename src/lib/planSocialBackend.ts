import { supabase } from './supabase';

export type PlanPerson={id:string;name:string;avatar?:string};
export type PlanSocialDetails={organizer:PlanPerson|null;participants:PlanPerson[]};

export async function loadPlanSocialDetails(planId:string):Promise<PlanSocialDetails>{
  if(!planId)return {organizer:null,participants:[]};

  const {data:plan,error:planError}=await supabase
    .from('plans')
    .select('creator_id')
    .eq('id',planId)
    .maybeSingle();
  if(planError)throw planError;

  const {data:members,error:membersError}=await supabase
    .from('plan_members')
    .select('user_id,status')
    .eq('plan_id',planId)
    .in('status',['attending','requested','waitlist','attended']);
  if(membersError)throw membersError;

  const ids=[...new Set([
    String(plan?.creator_id||''),
    ...(members||[]).map(row=>String(row.user_id||'')),
  ].filter(Boolean))];
  if(!ids.length)return {organizer:null,participants:[]};

  const {data:profiles,error:profilesError}=await supabase
    .from('profiles')
    .select('id,display_name,username,avatar_url')
    .in('id',ids);
  if(profilesError)throw profilesError;

  const byId=new Map<string,PlanPerson>();
  for(const profile of profiles||[]){
    const id=String(profile.id||'');
    if(!id)continue;
    byId.set(id,{
      id,
      name:String(profile.display_name||profile.username||'Usuario'),
      avatar:typeof profile.avatar_url==='string'&&profile.avatar_url?profile.avatar_url:undefined,
    });
  }

  const creatorId=String(plan?.creator_id||'');
  const organizer=creatorId?byId.get(creatorId)||null:null;
  const participants=(members||[])
    .map(row=>byId.get(String(row.user_id||'')))
    .filter((person):person is PlanPerson=>Boolean(person));

  return {organizer,participants};
}
