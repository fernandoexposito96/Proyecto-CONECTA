import { supabase } from './supabase';

export type BackendChatPreview={conversationId:string;userId?:string;planId?:string;name:string;avatar?:string;message:string;isGroup:boolean;};
export type BackendChatMessage={id:string;content:string;senderId:string;createdAt:string;};
type LatestMessage={content:string;createdAt:string};
const FALLBACK_CONCURRENCY=8;

export async function backendCurrentUserId(){const {data:{user},error}=await supabase.auth.getUser();if(error)throw error;return user?.id||null;}

export async function ensureDirectConversation(otherUserId:string){
  const userId=await backendCurrentUserId();
  if(!userId)throw new Error('Necesitas iniciar sesión para iniciar una conversación.');
  if(!otherUserId||otherUserId===userId)throw new Error('No se puede iniciar esta conversación.');
  const {data:own,error:ownError}=await supabase.from('conversation_members').select('conversation_id').eq('user_id',userId);if(ownError)throw ownError;
  const ids=[...new Set((own||[]).map(row=>String(row.conversation_id||'')).filter(Boolean))];
  if(ids.length){
    const {data:other,error:otherError}=await supabase.from('conversation_members').select('conversation_id').eq('user_id',otherUserId).in('conversation_id',ids);if(otherError)throw otherError;
    const candidates=[...new Set((other||[]).map(row=>String(row.conversation_id||'')).filter(Boolean))];
    if(candidates.length){const {data:direct,error:directError}=await supabase.from('conversations').select('id').in('id',candidates).eq('type','direct').limit(1).maybeSingle();if(directError)throw directError;if(direct?.id)return String(direct.id);}
  }
  const {data:created,error:createError}=await supabase.from('conversations').insert({type:'direct'}).select('id').single();if(createError)throw createError;
  const conversationId=String(created.id);
  const {error:memberError}=await supabase.from('conversation_members').insert([{conversation_id:conversationId,user_id:userId},{conversation_id:conversationId,user_id:otherUserId}]);
  if(memberError){await supabase.from('conversations').delete().eq('id',conversationId);throw memberError;}
  return conversationId;
}

async function loadLatestMessages(conversationIds:string[]){
  const latestByConversation=new Map<string,LatestMessage|null>();if(!conversationIds.length)return latestByConversation;
  const batchLimit=Math.min(1000,Math.max(100,conversationIds.length*20));
  const {data:recentMessages,error:recentError,count}=await supabase.from('messages').select('conversation_id,content,created_at',{count:'exact'}).in('conversation_id',conversationIds).order('created_at',{ascending:false}).limit(batchLimit);if(recentError)throw recentError;
  for(const message of recentMessages||[]){const conversationId=String(message.conversation_id||'');if(!conversationId||latestByConversation.has(conversationId))continue;latestByConversation.set(conversationId,{content:String(message.content||''),createdAt:String(message.created_at||'')});}
  const missingIds=conversationIds.filter(id=>!latestByConversation.has(id));if(count!==null&&count<=(recentMessages||[]).length){for(const id of missingIds)latestByConversation.set(id,null);return latestByConversation;}
  for(let index=0;index<missingIds.length;index+=FALLBACK_CONCURRENCY){const chunk=missingIds.slice(index,index+FALLBACK_CONCURRENCY);const entries=await Promise.all(chunk.map(async conversationId=>{const {data,error}=await supabase.from('messages').select('content,created_at').eq('conversation_id',conversationId).order('created_at',{ascending:false}).limit(1).maybeSingle();if(error)throw error;return [conversationId,data?{content:String(data.content||''),createdAt:String(data.created_at||'')}:null] as const;}));for(const [id,latest] of entries)latestByConversation.set(id,latest);}
  return latestByConversation;
}

export async function loadBackendChats():Promise<BackendChatPreview[]>{
  const userId=await backendCurrentUserId();if(!userId)return [];
  const {data:ownMemberships,error:membershipError}=await supabase.from('conversation_members').select('conversation_id').eq('user_id',userId);if(membershipError)throw membershipError;
  const conversationIds=[...new Set((ownMemberships||[]).map(row=>String(row.conversation_id||'')).filter(Boolean))];if(!conversationIds.length)return [];
  const [{data:conversations,error:conversationError},{data:members,error:membersError},latestByConversation]=await Promise.all([supabase.from('conversations').select('id,type,title,plan_id,created_at').in('id',conversationIds),supabase.from('conversation_members').select('conversation_id,user_id').in('conversation_id',conversationIds),loadLatestMessages(conversationIds)]);if(conversationError)throw conversationError;if(membersError)throw membersError;
  const membersByConversation=new Map<string,string[]>();for(const member of members||[]){const conversationId=String(member.conversation_id||'');const memberId=String(member.user_id||'');if(!conversationId||!memberId)continue;const list=membersByConversation.get(conversationId)||[];list.push(memberId);membersByConversation.set(conversationId,list);}
  const otherUserIds=[...new Set((members||[]).map(row=>String(row.user_id||'')).filter(id=>id&&id!==userId))];const profilesById=new Map<string,{name:string;avatar?:string}>();
  if(otherUserIds.length){const {data:profiles,error:profileError}=await supabase.from('profiles').select('id,display_name,username,avatar_url').in('id',otherUserIds);if(profileError)throw profileError;for(const profile of profiles||[]){const id=String(profile.id||'');if(!id)continue;profilesById.set(id,{name:String(profile.display_name||profile.username||'Usuario'),avatar:typeof profile.avatar_url==='string'&&profile.avatar_url?profile.avatar_url:undefined});}}
  const rows=(conversations||[]).map(conversation=>{const conversationId=String(conversation.id||'');const latest=latestByConversation.get(conversationId);const isGroup=String(conversation.type||'direct')!=='direct';const memberIds=membersByConversation.get(conversationId)||[];const otherId=memberIds.find(id=>id&&id!==userId);const profile=otherId?profilesById.get(otherId):undefined;const planId=typeof conversation.plan_id==='string'&&conversation.plan_id?conversation.plan_id:undefined;return {preview:{conversationId,userId:otherId||undefined,planId,name:isGroup?String(conversation.title||'Grupo CONECTA'):(profile?.name||'Conversación'),avatar:profile?.avatar,message:latest?.content||'Conversación nueva',isGroup} satisfies BackendChatPreview,activityAt:latest?.createdAt||String(conversation.created_at||'')};});
  return rows.sort((a,b)=>Date.parse(b.activityAt||'')-Date.parse(a.activityAt||'')).map(row=>row.preview);
}

export async function loadBackendMessages(conversationId:string,limit=100):Promise<BackendChatMessage[]>{if(!conversationId)return [];const safeLimit=Math.max(1,Math.min(limit,200));const {data,error}=await supabase.from('messages').select('id,sender_id,content,created_at').eq('conversation_id',conversationId).order('created_at',{ascending:false}).limit(safeLimit);if(error)throw error;return (data||[]).map(message=>({id:String(message.id||''),content:String(message.content||''),senderId:String(message.sender_id||''),createdAt:String(message.created_at||'')})).reverse();}
export async function sendBackendMessage(conversationId:string,content:string){const clean=content.trim();if(!conversationId||!clean)return false;const userId=await backendCurrentUserId();if(!userId)return false;const {error}=await supabase.from('messages').insert({conversation_id:conversationId,sender_id:userId,content:clean,kind:'text'});if(error)throw error;return true;}
