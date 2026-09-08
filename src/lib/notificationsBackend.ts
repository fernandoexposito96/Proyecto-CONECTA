import { supabase } from './supabase';

export type BackendNotification={
  id:string;
  type:string;
  title:string;
  body:string;
  read:boolean;
  createdAt:string;
};

type NotificationRow={
  id:string;
  type:string;
  title:string;
  body:string|null;
  read:boolean;
  created_at:string;
};

export async function fetchBackendNotifications(limit=100):Promise<BackendNotification[]>{
  const safeLimit=Math.max(1,Math.min(limit,200));
  const {data,error}=await supabase
    .from('notifications')
    .select('id,type,title,body,read,created_at')
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
  }));
}

export async function fetchUnreadNotificationCount(){
  const {count,error}=await supabase
    .from('notifications')
    .select('id',{count:'exact',head:true})
    .eq('read',false);
  if(error)throw error;
  return count||0;
}

export async function markBackendNotificationRead(id:string){
  const {error}=await supabase
    .from('notifications')
    .update({read:true})
    .eq('id',id)
    .eq('read',false);
  if(error)throw error;
}
