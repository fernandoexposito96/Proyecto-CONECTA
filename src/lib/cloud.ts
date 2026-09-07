import type { Plan } from '../types';
import { supabase } from './supabase';

const storagePrefix='conecta-';
let pendingState:Record<string,unknown>={};
let flushTimer:number|null=null;

function localPrototypeState(){
  const state:Record<string,unknown>={};
  for(let index=0;index<window.localStorage.length;index+=1){
    const key=window.localStorage.key(index);
    if(!key?.startsWith(storagePrefix))continue;
    const raw=window.localStorage.getItem(key);
    if(raw===null)continue;
    try{state[key]=JSON.parse(raw) as unknown}catch{state[key]=raw}
  }
  return state;
}

export async function hydrateCloudState(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session)return false;

  const {data,error}=await supabase
    .from('prototype_state')
    .select('state')
    .eq('user_id',session.user.id)
    .maybeSingle();

  if(error)throw error;

  if(data?.state&&typeof data.state==='object'&&!Array.isArray(data.state)){
    for(const [key,value] of Object.entries(data.state as Record<string,unknown>)){
      if(!key.startsWith(storagePrefix))continue;
      window.localStorage.setItem(key,JSON.stringify(value));
    }
    return true;
  }

  const state=localPrototypeState();
  const {error:upsertError}=await supabase
    .from('prototype_state')
    .upsert({user_id:session.user.id,state,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(upsertError)throw upsertError;
  return true;
}

async function flushCloudState(){
  flushTimer=null;
  const patch=pendingState;
  pendingState={};
  if(!Object.keys(patch).length)return;

  const {data:{session}}=await supabase.auth.getSession();
  if(!session)return;

  const {data}=await supabase
    .from('prototype_state')
    .select('state')
    .eq('user_id',session.user.id)
    .maybeSingle();

  const current=data?.state&&typeof data.state==='object'&&!Array.isArray(data.state)
    ? data.state as Record<string,unknown>
    : {};

  const {error}=await supabase
    .from('prototype_state')
    .upsert({
      user_id:session.user.id,
      state:{...current,...patch},
      updated_at:new Date().toISOString(),
    },{onConflict:'user_id'});

  if(error)console.warn('CONECTA cloud state sync failed',error.message);
}

export function queueCloudStateSave(key:string,value:unknown){
  if(!key.startsWith(storagePrefix))return;
  pendingState[key]=value;
  if(flushTimer!==null)window.clearTimeout(flushTimer);
  flushTimer=window.setTimeout(()=>{void flushCloudState()},300);
}

type PrototypePlanRow={
  id:string;
  creator_id:string;
  plan:unknown;
  created_at:string;
};

export async function fetchSharedPlans():Promise<Plan[]>{
  const {data,error}=await supabase
    .from('prototype_plans')
    .select('id,creator_id,plan,created_at')
    .order('created_at',{ascending:false})
    .limit(200);

  if(error)throw error;
  return ((data||[]) as PrototypePlanRow[])
    .map(row=>row.plan)
    .filter((plan):plan is Plan=>Boolean(
      plan&&typeof plan==='object'&&
      'title' in plan&&typeof (plan as Plan).title==='string'&&
      'image' in plan&&typeof (plan as Plan).image==='string'
    ));
}

export async function createSharedPlan(plan:Plan){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session)throw new Error('Necesitas iniciar sesión para publicar un plan.');

  const {error}=await supabase
    .from('prototype_plans')
    .insert({creator_id:session.user.id,plan});
  if(error)throw error;
}
