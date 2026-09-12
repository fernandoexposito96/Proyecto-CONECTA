import { supabase } from './supabase';
import { isRealUserId } from './privacyBackend';

type ConnectionRow={
  id:string;
  requester_id:string;
  receiver_id:string;
  status:'pending'|'accepted'|'rejected';
};

async function currentUserId(){
  const {data:{user},error}=await supabase.auth.getUser();
  if(error)throw error;
  return user?.id||null;
}

async function findConnection(userId:string,targetUserId:string):Promise<ConnectionRow|null>{
  const {data,error}=await supabase
    .from('connections')
    .select('id,requester_id,receiver_id,status')
    .or(`and(requester_id.eq.${userId},receiver_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},receiver_id.eq.${userId})`)
    .limit(1)
    .maybeSingle();
  if(error)throw error;
  return data as ConnectionRow|null;
}

export async function requestBackendConnection(targetUserId:string){
  if(!isRealUserId(targetUserId))return false;
  const userId=await currentUserId();
  if(!userId||userId===targetUserId)return false;

  const existing=await findConnection(userId,targetUserId);
  if(existing?.status==='accepted'||existing?.status==='pending'&&existing.requester_id===userId)return true;

  if(existing?.status==='pending'&&existing.receiver_id===userId){
    const {error}=await supabase
      .from('connections')
      .update({status:'accepted',updated_at:new Date().toISOString()})
      .eq('id',existing.id);
    if(error)throw error;
    return true;
  }

  if(existing){
    const {error}=await supabase.from('connections').delete().eq('id',existing.id);
    if(error)throw error;
  }

  const {error}=await supabase.from('connections').insert({
    requester_id:userId,
    receiver_id:targetUserId,
    status:'pending',
  });
  if(error)throw error;
  return true;
}

export async function removeBackendConnection(targetUserId:string){
  if(!isRealUserId(targetUserId))return false;
  const userId=await currentUserId();
  if(!userId||userId===targetUserId)return false;

  const existing=await findConnection(userId,targetUserId);
  if(!existing)return true;
  const {error}=await supabase.from('connections').delete().eq('id',existing.id);
  if(error)throw error;
  return true;
}

export async function loadBackendConnectionIds(){
  const userId=await currentUserId();
  if(!userId)return new Set<string>();

  const {data,error}=await supabase
    .from('connections')
    .select('requester_id,receiver_id,status')
    .eq('status','accepted')
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
  if(error)throw error;

  const ids=new Set<string>();
  for(const row of data||[]){
    const requester=String(row.requester_id||'');
    const receiver=String(row.receiver_id||'');
    if(requester===userId&&isRealUserId(receiver))ids.add(receiver);
    if(receiver===userId&&isRealUserId(requester))ids.add(requester);
  }
  return ids;
}
