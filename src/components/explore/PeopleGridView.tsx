import { Heart, MapPin } from 'lucide-react';
import type { PeopleFilter, Person, PrivacySettings } from '../../types';
import { distanceCopy } from '../../lib/privacy';
import { PeopleFilterRow } from './PeopleFilterRow';

export function PeopleGridView({people,filter,locationAllowed,privacy,liked,onFilter,onOpen,onToggleLike,onBack}:{people:Person[];filter:PeopleFilter;locationAllowed:boolean;privacy:PrivacySettings;liked:Set<string>;onFilter:(value:PeopleFilter)=>void;onOpen:(person:Person)=>void;onToggleLike:(person:Person)=>void;onBack:()=>void}){
  return <div className="page explore-page people-grid-page">
    <div className="people-swipe-head"><button aria-label="Volver a Explora" onClick={onBack}>←</button><div className="people-swipe-title"><h1>Personas para ti</h1><p>Conoce gente afín a tus gustos</p></div><span/></div>
    <PeopleFilterRow value={filter} onChange={onFilter} locationAllowed={locationAllowed}/>
    <div className="people-browser-grid">{people.map(person=><article key={person.name} className="people-browser-card" role="button" tabIndex={0} onClick={()=>onOpen(person)} onKeyDown={e=>{if(e.key==='Enter')onOpen(person)}}><div className="people-browser-photo"><img src={person.image} alt={`${person.name}, ${person.age} años`}/><button className={liked.has(person.name)?'is-liked':''} aria-label={`Me gusta ${person.name}`} onClick={e=>{e.stopPropagation();onToggleLike(person)}}><Heart fill={liked.has(person.name)?'currentColor':'none'}/></button></div><div className="people-browser-copy"><strong>{person.name}, {person.age}</strong><span><MapPin/> {distanceCopy(person.distance,privacy)}</span><p>{person.tags.slice(0,3).join(', ')}</p><small>{person.match} afinidad</small></div></article>)}</div>
  </div>;
}
