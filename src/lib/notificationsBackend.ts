import { supabase } from './supabase';

export type BackendNotification={
  id:string;
  type:string;
  title:string;
  body:string;
  read:boolean;
  createdAt:string;
  entityType:string|null;
  entityId:string|null;
};

type NotificationRow={
  id:string;
  type:string;
  title:string;
  body:string|null;
  read:boolean;
  created_at:string;
  entity_type:string|null;
  entity_id:string|null;
};

async function currentNotificationUserId(){
  const {data:{user},error}=await supabase.auth.getUser();
  if(error)throw error;
  return user?.id||null;
}

export async function fetchBackendNotifications(limit=100):Promise<BackendNotification[]>{
  const userId=await currentNotificationUserId();
  if(!userId)return [];
  const safeLimit=Math.max(1,Math.min(limit,200));
  const {data,error}=await supabase
    .from('notifications')
    .select('id,type,title,body,read,created_at,entity_type,entity_id')
    .eq('user_id',userId)
    .order('created_at',{ascending:false})
    .limit(safeLimit);
  if(error)throw error;
  return ((data||[]) as NotificationRow[]).map(row=>({
    id:row.id,
    type:row.type,
    title:row.title,
    body:row.body||'',
    read:row.read,
    createdAt:row.created_at,
    entityType:row.entity_type,
    entityId:row.entity_id,
  }));
}

export async function fetchUnreadNotificationCount(){
  const userId=await currentNotificationUserId();
  if(!userId)return 0;
  const {count,error}=await supabase
    .from('notifications')
    .select('id',{count:'exact',head:true})
    .eq('user_id',userId)
    .eq('read',false);
  if(error)throw error;
  return count||0;
}

export async function markBackendNotificationRead(id:string){
  const userId=await currentNotificationUserId();
  if(!userId)return;
  const {error}=await supabase
    .from('notifications')
    .update({read:true})
    .eq('id',id)
    .eq('user_id',userId)
    .eq('read',false);
  if(error)throw error;
}
