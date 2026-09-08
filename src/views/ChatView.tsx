import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Search, Send, X } from 'lucide-react';
import { chats, people } from '../data/demoData';
import { blockedNames } from '../lib/privacy';
import { loadStored, saveStored, storageKeys } from '../lib/storage';
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

export function ChatView({initialContact=null}:{initialContact?:string|null}){
  const [blocked]=useState<Set<string>>(()=>blockedNames());
  const [tab,setTab]=useState<ChatTab>('Todos');
  const [searchOpen,setSearchOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [activeChat,setActiveChat]=useState<string|null>(()=>initialContact&&!blocked.has(initialContact)?initialContact:null);
  const [draft,setDraft]=useState('');
  const [sent,setSent]=useState<Record<string,string[]>>(()=>loadStored(storageKeys.chatMessages,{}));

  useEffect(()=>{saveStored(storageKeys.chatMessages,sent)},[sent]);
  useEffect(()=>{if(initialContact&&!blocked.has(initialContact))setActiveChat(initialContact)},[initialContact,blocked]);

  const items=useMemo<ChatItem[]>(()=>{
    const base:ChatItem[]=chats
      .map(([name,msg,count],i)=>({name,msg,count,isGroup:groupNames.has(name),avatar:avatarFor(name,i)}))
      .filter(item=>item.isGroup||!blocked.has(item.name));
    if(initialContact&&!blocked.has(initialContact)&&!base.some(item=>item.name===initialContact)){
      base.unshift({name:initialContact,msg:'Nueva conversación',count:'',isGroup:false,avatar:avatarFor(initialContact)});
    }
    return base;
  },[initialContact,blocked]);

  const visible=useMemo(()=>items.filter(item=>{
    if(tab==='Grupos'&&!item.isGroup)return false;
    if(tab==='Planes'&&item.isGroup)return false;
    const q=query.trim().toLocaleLowerCase('es');
    return !q||`${item.name} ${item.msg}`.toLocaleLowerCase('es').includes(q);
  }),[items,tab,query]);

  if(activeChat){
    const item=items.find(candidate=>candidate.name===activeChat);
    if(!item){setActiveChat(null);return null;}
    const messages=[item.msg,...(sent[activeChat]||[])];
    const send=()=>{const text=draft.trim();if(!text)return;setSent(v=>({...v,[activeChat]:[...(v[activeChat]||[]),text]}));setDraft('');};
    return <div className="page chat-page"><div className="chat-thread-head"><button aria-label="Volver a chats" onClick={()=>setActiveChat(null)}><ChevronLeft/></button><img src={item.avatar} alt={item.name}/><div><strong>{item.name}</strong><span>Conversación</span></div></div><div className="chat-thread"><div className="message received">{item.msg}</div>{messages.slice(1).map((m,i)=><div className="message sent" key={`${m}-${i}`}>{m}</div>)}</div><div className="chat-composer"><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send();}} placeholder="Escribe un mensaje..." aria-label="Escribe un mensaje"/><button onClick={send} aria-label="Enviar mensaje"><Send/></button></div></div>;
  }

  const blockedAttempt=Boolean(initialContact&&blocked.has(initialContact));
  return <div className="page chat-page"><div className="page-title"><div><h1>Chat</h1><p>Tus conversaciones y grupos</p></div><button aria-label="Buscar conversaciones" onClick={()=>setSearchOpen(v=>!v)}>{searchOpen?<X/>:<Search/>}</button></div>{blockedAttempt&&<div className="empty-state">Este usuario está bloqueado. Puedes gestionarlo desde Ajustes → Privacidad → Usuarios bloqueados.</div>}{searchOpen&&<div className="explore-search"><Search/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar conversación" aria-label="Buscar conversación"/></div>}<div className="tabs">{(['Todos','Planes','Grupos'] as ChatTab[]).map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div><div className="chat-list">{visible.map((item,i)=><button key={item.name} onClick={()=>setActiveChat(item.name)}><img loading="lazy" decoding="async" src={item.avatar} alt={item.name}/><div><strong>{item.name}</strong><span>{(sent[item.name]?.at(-1))||item.msg}</span></div><small>{i<3?'12:'+(45-i*8):'Ayer'}</small>{item.count&&<b>{item.count}</b>}</button>)}</div></div>
}
