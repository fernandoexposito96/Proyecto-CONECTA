import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Search, Send, X } from 'lucide-react';
import { chats } from '../data/demoData';
import { loadStored, saveStored, storageKeys } from '../lib/storage';

type ChatTab='Todos'|'Planes'|'Grupos';
type ChatItem={name:string;msg:string;count:string;isGroup:boolean;avatar:string};

const groupNames=new Set(['Grupo Pádel','Viaje a Madrid','Running Tarragona','Cine y palomitas']);
const avatars=[
  'photo-1500648767791-00dcc994a43e',
  'photo-1494790108377-be9c29b29330',
  'photo-1507003211169-0a1dd7228f2d',
  'photo-1534528741775-53994a69daeb',
  'photo-1507591064344-4c6ce005b128',
  'photo-1544005313-94ddf0286df2',
];
const socialAvatar:Record<string,string>={
  'Lucía':'photo-1524504388940-b1c1722653e1',
  'Carlos':'photo-1507003211169-0a1dd7228f2d',
  'Marta':'photo-1494790108377-be9c29b29330',
  'Álex':'photo-1507591064344-4c6ce005b128',
  'Sara':'photo-1544005313-94ddf0286df2',
};
const avatarUrl=(id:string)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=120&q=82`;

export function ChatView({initialContact=null}:{initialContact?:string|null}){
  const [tab,setTab]=useState<ChatTab>('Todos');
  const [searchOpen,setSearchOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [activeChat,setActiveChat]=useState<string|null>(initialContact);
  const [draft,setDraft]=useState('');
  const [sent,setSent]=useState<Record<string,string[]>>(()=>loadStored(storageKeys.chatMessages,{}));

  useEffect(()=>{saveStored(storageKeys.chatMessages,sent)},[sent]);
  useEffect(()=>{if(initialContact)setActiveChat(initialContact)},[initialContact]);

  const items=useMemo<ChatItem[]>(()=>{
    const base:ChatItem[]=chats.map(([name,msg,count],i)=>({name,msg,count,isGroup:groupNames.has(name),avatar:avatarUrl(socialAvatar[name]||avatars[i%avatars.length])}));
    if(initialContact&&!base.some(item=>item.name===initialContact)){
      base.unshift({name:initialContact,msg:'Nueva conversación',count:'',isGroup:false,avatar:avatarUrl(socialAvatar[initialContact]||avatars[0])});
    }
    return base;
  },[initialContact]);

  const visible=useMemo(()=>items.filter(item=>{
    if(tab==='Grupos'&&!item.isGroup)return false;
    if(tab==='Planes'&&item.isGroup)return false;
    const q=query.trim().toLocaleLowerCase('es');
    return !q||`${item.name} ${item.msg}`.toLocaleLowerCase('es').includes(q);
  }),[items,tab,query]);

  if(activeChat){
    const item=items.find(candidate=>candidate.name===activeChat)||{name:activeChat,msg:'Nueva conversación',count:'',isGroup:false,avatar:avatarUrl(socialAvatar[activeChat]||avatars[0])};
    const messages=[item.msg,...(sent[activeChat]||[])];
    const send=()=>{const text=draft.trim();if(!text)return;setSent(v=>({...v,[activeChat]:[...(v[activeChat]||[]),text]}));setDraft('');};
    return <div className="page chat-page"><div className="chat-thread-head"><button aria-label="Volver a chats" onClick={()=>setActiveChat(null)}><ChevronLeft/></button><img src={item.avatar} alt={item.name}/><div><strong>{item.name}</strong><span>Conversación</span></div></div><div className="chat-thread"><div className="message received">{item.msg}</div>{messages.slice(1).map((m,i)=><div className="message sent" key={`${m}-${i}`}>{m}</div>)}</div><div className="chat-composer"><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send();}} placeholder="Escribe un mensaje..." aria-label="Escribe un mensaje"/><button onClick={send} aria-label="Enviar mensaje"><Send/></button></div></div>;
  }

  return <div className="page chat-page"><div className="page-title"><div><h1>Chat</h1><p>Tus conversaciones y grupos</p></div><button aria-label="Buscar conversaciones" onClick={()=>setSearchOpen(v=>!v)}>{searchOpen?<X/>:<Search/>}</button></div>{searchOpen&&<div className="explore-search"><Search/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar conversación" aria-label="Buscar conversación"/></div>}<div className="tabs">{(['Todos','Planes','Grupos'] as ChatTab[]).map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div><div className="chat-list">{visible.map((item,i)=><button key={item.name} onClick={()=>setActiveChat(item.name)}><img loading="lazy" decoding="async" src={item.avatar} alt={item.name}/><div><strong>{item.name}</strong><span>{(sent[item.name]?.at(-1))||item.msg}</span></div><small>{i<3?'12:'+(45-i*8):'Ayer'}</small>{item.count&&<b>{item.count}</b>}</button>)}</div></div>
}
