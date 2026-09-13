import { ChevronLeft, MapPin } from 'lucide-react';
import type { Person, PrivacySettings } from '../../types';
import { distanceCopy } from '../../lib/privacy';

export function PersonDetailCard({person,privacy,onClose,onChat}:{person:Person;privacy:PrivacySettings;onClose:()=>void;onChat:(name:string)=>void}){
  return <div className="person-detail-overlay" onClick={onClose}>
    <article className="person-detail-card" onClick={e=>e.stopPropagation()}>
      <div className="person-detail-hero">
        <img src={person.image} alt={person.name}/>
        <button className="person-detail-back" aria-label="Cerrar perfil" onClick={onClose}><ChevronLeft/></button>
        <div className="person-detail-title"><h2>{person.name}, {person.age}</h2><span><MapPin size={14}/> {distanceCopy(person.distance,privacy)} · {person.match} afinidad</span></div>
      </div>
      <div className="person-detail-body">
        <strong>{person.job}</strong><p>{person.bio}</p>
        <div className="person-detail-tags">{person.tags.map(tag=><span key={tag}>{tag}</span>)}</div>
        <div className="person-mini-gallery">{person.gallery.map((image,index)=><img key={`${image}-${index}`} src={image} alt={`Foto ${index+1} de ${person.name}`}/>)}</div>
        <button className="person-chat-cta" onClick={()=>onChat(person.name)}>Hablar con {person.name}</button>
      </div>
    </article>
  </div>;
}
