import { supabase } from './supabase';

export type BackendChatPreview={
  conversationId:string;
  userId?:string;
  planId?:string;
  name:string;
  avatar?:string;
  message:string;
  isGroup:boolean;
};

export type BackendChatMessage={
  id:string;
  content:string;
  senderId:string;
  createdAt:string;
};

type LatestMessage={content:string;createdAt:string};

export async function backendCurrentUserId(){
  const {data:{user},error}=await supabase.auth.getUser();
  if(error)throw error;
  return user?.id||null;
}

async function loadLatestMessages(conversationIds:string[]){
  const latestByConversation=new Map<string,LatestMessage|null>();
  if(!conversationIds.length)return latestByConversation;

  const batchLimit=Math.min(2000,Math.max(100,conversationIds.length*20));
  const {data:recentMessages,error:recentError}=await supabase
    .from('messages')
    .select('conversation_id,content,created_at')
    .in('conversation_id',conversationIds)
    .order('created_at',{ascending:false})
    .limit(batchLimit);
  if(recentError)throw recentError;

  for(const message of recentMessages||[]){
    const conversationId=String(message.conversation_id||'');
    if(!conversationId||latestByConversation.has(conversationId))continue;
    latestByConversation.set(conversationId,{
      content:String(message.content||''),
      createdAt:String(message.created_at||''),
    });
  }

  const missingIds=conversationIds.filter(id=>!latestByConversation.has(id));
  if(missingIds.length){
    const fallbackEntries=await Promise.all(missingIds.map(async conversationId=>{
      const {data,error}=await supabase
        .from('messages')
        .select('content,created_at')
        .eq('conversation_id',conversationId)
        .order('created_at',{ascending:false})
        .limit(1)
        .maybeSingle();
      if(error)throw error;
      return [conversationId,data?{
        content:String(data.content||''),
        createdAt:String(data.created_at||''),
      }:null] as const;
    }));
    for(const [conversationId,latest] of fallbackEntries)latestByConversation.set(conversationId,latest);
  }

  return latestByConversation;
}

export async function loadBackendChats():Promise<BackendChatPreview[]>{
  const userId=await backendCurrentUserId();
  if(!userId)return [];

  const {data:ownMemberships,error:membershipError}=await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id',userId);
  if(membershipError)throw membershipError;

  const conversationIds=[...new Set((ownMemberships||[]).map(row=>String(row.conversation_id||'')).filter(Boolean))];
  if(!conversationIds.length)return [];

  const [{data:conversations,error:conversationError},{data:members,error:membersError},latestByConversation]=await Promise.all([
    supabase.from('conversations').select('id,type,title,plan_id,created_at').in('id',conversationIds),
    supabase.from('conversation_members').select('conversation_id,user_id').in('conversation_id',conversationIds),
    loadLatestMessages(conversationIds),
  ]);
  if(conversationError)throw conversationError;
  if(membersError)throw membersError;

  const membersByConversation=new Map<string,string[]>();
  for(const member of members||[]){
    const conversationId=String(member.conversation_id||'');
    const memberId=String(member.user_id||'');
    if(!conversationId||!memberId)continue;
    const list=membersByConversation.get(conversationId)||[];
    list.push(memberId);
    membersByConversation.set(conversationId,list);
  }

  const otherUserIds=[...new Set((members||[])
    .map(row=>String(row.user_id||''))
    .filter(id=>id&&id!==userId))];

  const profilesById=new Map<string,{name:string;avatar?:string}>();
  if(otherUserIds.length){
    const {data:profiles,error:profileError}=await supabase
      .from('profiles')
      .select('id,display_name,username,avatar_url')
      .in('id',otherUserIds);
    if(profileError)throw profileError;
    for(const profile of profiles||[]){
      const id=String(profile.id||'');
      if(!id)continue;
      profilesById.set(id,{
        name:String(profile.display_name||profile.username||'Usuario'),
        avatar:typeof profile.avatar_url==='string'&&profile.avatar_url?profile.avatar_url:undefined,
      });
    }
  }

  const rows=(conversations||[]).map(conversation=>{
    const conversationId=String(conversation.id||'');
    const latest=latestByConversation.get(conversationId);
    const isGroup=String(conversation.type||'direct')!=='direct';
    const memberIds=membersByConversation.get(conversationId)||[];
    const otherId=memberIds.find(id=>id&&id!==userId);
    const profile=otherId?profilesById.get(otherId):undefined;
    const planId=typeof conversation.plan_id==='string'&&conversation.plan_id?conversation.plan_id:undefined;
    return {
      preview:{
        conversationId,
        userId:otherId||undefined,
        planId,
        name:isGroup?String(conversation.title||'Grupo CONECTA'):(profile?.name||'Conversación'),
        avatar:profile?.avatar,
        message:latest?.content||'Conversación nueva',
        isGroup,
      } satisfies BackendChatPreview,
      activityAt:latest?.createdAt||String(conversation.created_at||''),
    };
  });

  return rows
    .sort((a,b)=>Date.parse(b.activityAt||'')-Date.parse(a.activityAt||''))
    .map(row=>row.preview);
}

export async function loadBackendMessages(conversationId:string):Promise<BackendChatMessage[]>{
  if(!conversationId)return [];
  const {data,error}=await supabase
    .from('messages')
    .select('id,sender_id,content,created_at')
    .eq('conversation_id',conversationId)
    .order('created_at',{ascending:true})
    .limit(300);
  if(error)throw error;
  return (data||[]).map(message=>({
    id:String(message.id||''),
    content:String(message.content||''),
    senderId:String(message.sender_id||''),
    createdAt:String(message.created_at||''),
  }));
}

export async function sendBackendMessage(conversationId:string,content:string){
  const clean=content.trim();
  if(!conversationId||!clean)return false;
  const userId=await backendCurrentUserId();
  if(!userId)return false;

  const {error}=await supabase.from('messages').insert({
    conversation_id:conversationId,
    sender_id:userId,
    content:clean,
    kind:'text',
  });
  if(error)throw error;
  return true;
}
