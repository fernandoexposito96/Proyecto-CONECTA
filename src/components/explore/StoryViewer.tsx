import { Heart, MapPin, Send, X } from 'lucide-react';
import type { Story } from '../../types';

export function StoryViewer({story,liked,reply,onReply,onLike,onSend,onClose}:{story:Story;liked:boolean;reply:string;onReply:(value:string)=>void;onLike:()=>void;onSend:()=>void;onClose:()=>void}){
  return <div className="story-viewer"><button className="story-close" aria-label="Cerrar estado" onClick={onClose}><X/></button><img src={story.image} alt={story.caption}/><div className="story-progress"><span/></div><div className="story-user"><img src={story.avatar} alt={story.name}/><div><strong>{story.name}</strong><small>{story.time}</small></div></div><div className="story-caption"><strong>{story.caption}</strong><span><MapPin/>{story.location}</span></div><div className="story-response"><input value={reply} onChange={e=>onReply(e.target.value)} placeholder={`Responder a ${story.name}...`}/><button className={liked?'is-liked':''} onClick={onLike}><Heart fill={liked?'currentColor':'none'}/></button><button onClick={onSend}><Send/></button></div></div>;
}
