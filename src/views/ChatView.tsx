import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Search, Send, X } from 'lucide-react';
import { chats, people } from '../data/demoData';
import { backendCurrentUserId, loadBackendChats, loadBackendMessages, sendBackendMessage, type BackendChatMessage, type BackendChatPreview } from '../lib/chatBackend';
import { blockedNames, loadBlockedUsers } from '../lib/privacy';
import { loadStored, saveStored, storageChangeEvent, storageKeys } from '../lib/storage';
import type { ChatItem, ChatTab } from '../types';

const groupNames=new Set(['Grupo Pádel','Viaje a Madrid','Running Tarragona','Cine y palomitas']);
const fallbackAvatars=[
  './assets/images/photo-1500648767791-00dcc994a43e.jpg',
  './assets/images/photo-1494790108377-be9c29b29330.jpg',
  './assets/images/photo-1507003211169-0a1dd7228f2d.jpg',
  './assets/images/photo-1534528741775-53994a69daeb.jpg',
  './assets/images/photo-1507591064344-4c6ce005b128.jpg',
  './assets/images/photo-1544005313-94ddf0286df2.jpg',
];
const avatarFor=(name:string,index=0)=>people.find(person=>person.name===name)?.image||fallbackAvatars[index%fallbackAvatars.length];
const chatKey=(item:ChatItem)=>item.conversationId||`demo:${item.name}:${item.isGroup?'group':'direct'}`;
const planTargetId=(target:string|null|undefined)=>target?.startsWith('plan:')?target.slice(5):null;

export function ChatView({initialContact=null}:{initialContact?:string|null}){
  const [blocked,setBlocked]=useState<Set<string>>(()=>blockedNames());
  const [blockedIds,setBlockedIds]=useState<Set<string>>(()=>new Set(loadBlockedUsers().map(user=>user.userId)));
  const [tab,setTab]=useState<ChatTab>('Todos');
  const [searchOpen,setSearchOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [activeChat,setActiveChat]=useState<string|null>(()=>initialContact&&(planTargetId(initialContact)||!blocked.has(initialContact))?initialContact:null);
  const [draft,setDraft]=useState('');
  const [sent,setSent]=useState<Record<string,string[]>>(()=>loadStored(storageKeys.chatMessages,{}));
  const [backendChats,setBackendChats]=useState<BackendChatPreview[]>([]);
  const [backendThreads,setBackendThreads]=useState<Record<string,BackendChatMessage[]>>({});
  const [backendUserId,setBackendUserId]=useState<string|null>(null);
  const [backendLoaded,setBackendLoaded]=useState(false);
  const [sending,setSending]=useState(false);
  const [sendError,setSendError]=useState('');
  const [threadError,setThreadError]=useState('');

  useEffect(()=>{saveStored(storageKeys.chatMessages,sent)},[sent]);
  useEffect(()=>{
    const refreshBlocked=()=>{
      setBlocked(blockedNames());
      setBlockedIds(new Set(loadBlockedUsers().map(user=>user.userId)));
    };
    const onStorageChange=(event:Event)=>{
      const detail=(event as CustomEvent<{key?:string}>).detail;
      if(detail?.key===storageKeys.blockedUsers)refreshBlocked();
    };
    window.addEventListener(storageChangeEvent,onStorageChange);
    window.addEventListener('storage',refreshBlocked);
    return ()=>{
      window.removeEventListener(storageChangeEvent,onStorageChange);
      window.removeEventListener('storage',refreshBlocked);
    };
  },[]);
  useEffect(()=>{
    if(!initialContact)return;
    if(planTargetId(initialContact)||!blocked.has(initialContact))setActiveChat(initialContact);
  },[initialContact,blocked]);
  useEffect(()=>{
    let active=true;
    setBackendLoaded(false);
    void Promise.all([loadBackendChats(),backendCurrentUserId()])
      .then(([realChats,userId])=>{
        if(!active)return;
        setBackendChats(realChats);
        setBackendUserId(userId);
      })
      .catch(error=>console.warn('CONECTA real chat unavailable; demo fallback kept',error))
      .finally(()=>{if(active)setBackendLoaded(true)});
    return ()=>{active=false};
  },[]);

  const items=useMemo<ChatItem[]>(()=>{
    const realItems:ChatItem[]=backendChats
      .filter(real=>real.userId?!blockedIds.has(real.userId):(real.isGroup||!blocked.has(real.name)))
      .map((real,index)=>({
        name:real.name,
        msg:real.message,
        count:'',
        isGroup:real.isGroup,
        avatar:real.avatar||avatarFor(real.name,index),
        conversationId:real.conversationId,
        userId:real.userId,
        planId:real.planId,
      }));

    const demoItems:ChatItem[]=chats
      .map(([name,msg,count],i)=>({name,msg,count,isGroup:groupNames.has(name),avatar:avatarFor(name,i)}))
      .filter(item=>item.isGroup||!blocked.has(item.name));

    const base=[...realItems,...demoItems];
    if(initialContact&&!planTargetId(initialContact)&&!blocked.has(initialContact)&&!base.some(item=>item.name===initialContact)){
      base.unshift({name:initialContact,msg:'Nueva conversación',count:'',isGroup:false,avatar:avatarFor(initialContact)});
    }
    return base;
  },[initialContact,blocked,blockedIds,backendChats]);

  const activeItem=useMemo(()=>activeChat?items.find(item=>chatKey(item)===activeChat||item.name===activeChat||(item.planId&&`plan:${item.planId}`===activeChat)):undefined,[activeChat,items]);

  useEffect(()=>{
    setSendError('');
    setThreadError('');
    const conversationId=activeItem?.conversationId;
    if(!conversationId)return;
    let active=true;
    void loadBackendMessages(conversationId)
      .then(messages=>{if(active)setBackendThreads(current=>({...current,[conversationId]:messages}))})
      .catch(error=>{
        console.warn('CONECTA real thread unavailable; demo fallback kept',error);
        if(active)setThreadError('No se han podido cargar los mensajes sincronizados. Puedes volver atrás e intentarlo de nuevo.');
      });
    return ()=>{active=false};
  },[activeItem?.conversationId]);

  const visible=useMemo(()=>items.filter(item=>{
    if(tab==='Grupos'&&!item.isGroup)return false;
    if(tab==='Planes'&&item.isGroup)return false;
    const q=query.trim().toLocaleLowerCase('es');
    return !q||`${item.name} ${item.msg}`.toLocaleLowerCase('es').includes(q);
  }),[items,tab,query]);

  if(activeChat){
    const item=activeItem;
    if(!item&&planTargetId(activeChat)&&!backendLoaded){
      return <div className="page chat-page"><div className="empty-state"><strong>Cargando conversación del plan…</strong><span>Conectando con el grupo sincronizado.</span></div></div>;
    }
    if(!item){
      return <div className="page chat-page"><div className="empty-state"><strong>Esta conversación ya no está disponible.</strong><span>Puede haberse cerrado o haber cambiado tu acceso.</span><button type="button" onClick={()=>setActiveChat(null)}>Volver a chats</button></div></div>;
    }
    const localMessages=item.conversationId?[]:(sent[item.name]||[]);
    const realMessages=item.conversationId?backendThreads[item.conversationId]||[]:[];
    const send=async()=>{
      const text=draft.trim();
      if(!text||sending)return;
      setDraft('');
      setSendError('');
      setSending(true);
      try{
        if(item.conversationId){
          const sentReal=await sendBackendMessage(item.conversationId,text);
          if(!sentReal)throw new Error('La conversación no está disponible para envío.');
          const refreshed=await loadBackendMessages(item.conversationId);
          setBackendThreads(current=>({...current,[item.conversationId as string]:refreshed}));
          const refreshedChats=await loadBackendChats();
          setBackendChats(refreshedChats);
        }else{
          setSent(value=>({...value,[item.name]:[...(value[item.name]||[]),text]}));
        }
      }catch(error){
        console.warn('CONECTA real message send failed; message not marked as sent',error);
        setDraft(text);
        setSendError(error instanceof Error?error.message:'No se ha podido enviar el mensaje. Comprueba tu conexión e inténtalo otra vez.');
      }finally{
        setSending(false);
      }
    };
    return <div className="page chat-page"><div className="chat-thread-head"><button type="button" aria-label="Volver a chats" onClick={()=>setActiveChat(null)}><ChevronLeft/></button><img src={item.avatar} alt={item.name}/><div><strong>{item.name}</strong><span>Conversación</span></div></div><div className="chat-thread">{realMessages.length?realMessages.map(message=><div className={`message ${message.senderId===backendUserId?'sent':'received'}`} key={message.id}>{message.content}</div>):<div className="message received">{item.msg}</div>}{localMessages.map((message,index)=><div className="message sent" key={`${message}-${index}`}>{message}</div>)}</div>{threadError&&<div className="auth-message" role="status">{threadError}</div>}{sendError&&<div className="auth-message" role="alert">{sendError}</div>}<div className="chat-composer"><input value={draft} disabled={sending} onChange={event=>setDraft(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.nativeEvent.isComposing){event.preventDefault();void send();}}} placeholder="Escribe un mensaje..." aria-label="Escribe un mensaje"/><button type="button" disabled={sending||!draft.trim()} onClick={()=>{void send()}} aria-label="Enviar mensaje"><Send/></button></div></div>;
  }

  const blockedAttempt=Boolean(initialContact&&!planTargetId(initialContact)&&blocked.has(initialContact));
  return <div className="page chat-page"><div className="page-title"><div><h1>Chat</h1><p>Tus conversaciones y grupos</p></div><button type="button" aria-label="Buscar conversaciones" onClick={()=>setSearchOpen(value=>!value)}>{searchOpen?<X/>:<Search/>}</button></div>{blockedAttempt&&<div className="empty-state">Este usuario está bloqueado. Puedes gestionarlo desde Ajustes → Privacidad → Usuarios bloqueados.</div>}{searchOpen&&<div className="explore-search"><Search/><input autoFocus value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar conversación" aria-label="Buscar conversación"/></div>}<div className="tabs">{(['Todos','Planes','Grupos'] as ChatTab[]).map(item=><button type="button" key={item} className={tab===item?'active':''} onClick={()=>setTab(item)}>{item}</button>)}</div><div className="chat-list">{visible.map((item,index)=><button type="button" key={chatKey(item)} onClick={()=>setActiveChat(chatKey(item))}><img loading="lazy" decoding="async" src={item.avatar} alt={item.name}/><div><strong>{item.name}</strong><span>{item.conversationId?item.msg:(sent[item.name]?.at(-1)||item.msg)}</span></div><small>{index<3?'12:'+(45-index*8):'Ayer'}</small>{item.count&&<b>{item.count}</b>}</button>)}</div></div>;
}
