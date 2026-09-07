import { useMemo, useState } from 'react';
import { ChevronLeft, Search, Send, X } from 'lucide-react';
import { chats } from '../data/demoData';

type ChatTab='Todos'|'Planes'|'Grupos';

const avatarIds=['photo-1500648767791-00dcc994a43e','photo-1494790108377-be9c29b29330','photo-1500530855697-b586d89ba3ee','photo-1492562080023-ab3db95bfbce'];
const groupNames=new Set(['Grupo Pádel','Viaje a Madrid','Running Tarragona','Cine y palomitas']);

export function ChatView(){
  const [tab,setTab]=useState<ChatTab>('Todos');
  const [searchOpen,setSearchOpen]=useState(false);
  const [query,setQuery]=useState('');
  const [activeChat,setActiveChat]=useState<number|null>(null);
  const [draft,setDraft]=useState('');
  const [sent,setSent]=useState<Record<number,string[]>>({});

  const visible=useMemo(()=>chats.map((chat,i)=>({chat,i})).filter(({chat})=>{
    const [name,msg]=chat;
    if(tab==='Grupos'&&!groupNames.has(name))return false;
    if(tab==='Planes'&&groupNames.has(name))return false;
    const q=query.trim().toLocaleLowerCase('es');
    return !q||`${name} ${msg}`.toLocaleLowerCase('es').includes(q);
  }),[tab,query]);

  if(activeChat!==null){
    const [name,msg]=chats[activeChat];
    const messages=[msg,...(sent[activeChat]||[])];
    const send=()=>{const text=draft.trim();if(!text)return;setSent(v=>({...v,[activeChat]:[...(v[activeChat]||[]),text]}));setDraft('');};
    return <div className="page chat-page"><div className="chat-thread-head"><button aria-label="Volver a chats" onClick={()=>setActiveChat(null)}><ChevronLeft/></button><img src={`https://images.unsplash.com/${avatarIds[activeChat%avatarIds.length]}?auto=format&fit=crop&w=100&q=80`} alt={name}/><div><strong>{name}</strong><span>Conversación</span></div></div><div className="chat-thread"><div className="message received">{msg}</div>{messages.slice(1).map((m,i)=><div className="message sent" key={`${m}-${i}`}>{m}</div>)}</div><div className="chat-composer"><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')send();}} placeholder="Escribe un mensaje..." aria-label="Escribe un mensaje"/><button onClick={send} aria-label="Enviar mensaje"><Send/></button></div></div>;
  }

  return <div className="page chat-page"><div className="page-title"><div><h1>Chat</h1><p>Tus conversaciones y grupos</p></div><button aria-label="Buscar conversaciones" onClick={()=>setSearchOpen(v=>!v)}>{searchOpen?<X/>:<Search/>}</button></div>{searchOpen&&<div className="explore-search"><Search/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar conversación" aria-label="Buscar conversación"/></div>}<div className="tabs">{(['Todos','Planes','Grupos'] as ChatTab[]).map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}</div><div className="chat-list">{visible.map(({chat:[name,msg,count],i})=><button key={name} onClick={()=>setActiveChat(i)}><img loading="lazy" decoding="async" src={`https://images.unsplash.com/${avatarIds[i%avatarIds.length]}?auto=format&fit=crop&w=100&q=80`} alt={name}/><div><strong>{name}</strong><span>{msg}</span></div><small>{i<3?'12:'+(45-i*8):'Ayer'}</small>{count&&<b>{count}</b>}</button>)}</div></div>
}
