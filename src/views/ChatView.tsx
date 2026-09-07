import { Search } from 'lucide-react';
import { chats } from '../data/demoData';

export function ChatView(){
  return <div className="page chat-page"><div className="page-title"><div><h1>Chat</h1><p>Tus conversaciones y grupos</p></div><button><Search/></button></div><div className="tabs"><button className="active">Todos</button><button>Planes</button><button>Grupos</button></div><div className="chat-list">{chats.map(([name,msg,count],i)=><button key={name}><img loading="lazy" decoding="async" src={`https://images.unsplash.com/${['photo-1500648767791-00dcc994a43e','photo-1494790108377-be9c29b29330','photo-1500530855697-b586d89ba3ee','photo-1492562080023-ab3db95bfbce'][i%4]}?auto=format&fit=crop&w=100&q=80`}/><div><strong>{name}</strong><span>{msg}</span></div><small>{i<3?'12:'+(45-i*8):'Ayer'}</small>{count&&<b>{count}</b>}</button>)}</div></div>
}
