import { ChevronLeft, Heart, Info, Star, X } from 'lucide-react';
import type { PeopleFilter, Person, PrivacySettings } from '../../types';
import { distanceCopy } from '../../lib/privacy';
import { PeopleFilterRow } from './PeopleFilterRow';

export function PeopleSwipeView({people,index,filter,locationAllowed,privacy,onFilter,onBack,onAdvance,onDetail}:{people:Person[];index:number;filter:PeopleFilter;locationAllowed:boolean;privacy:PrivacySettings;onFilter:(value:PeopleFilter)=>void;onBack:()=>void;onAdvance:(like:boolean)=>void;onDetail:(person:Person)=>void}){
  const person=people[index];
  return <div className="page explore-page people-swipe-page">
    <div className="people-swipe-head"><button aria-label="Volver" onClick={onBack}><ChevronLeft/></button><div className="people-swipe-title"><h1>Personas para ti</h1><p>Desliza para conocer gente afín</p></div><span/></div>
    <PeopleFilterRow value={filter} onChange={onFilter} locationAllowed={locationAllowed}/>
    {person?<><div className="swipe-card"><img src={person.image} alt={`${person.name}, ${person.age} años`}/><div className="swipe-card-info"><div className="swipe-card-info-top"><h2>{person.name}, {person.age}</h2><button className="swipe-info-button" onClick={()=>onDetail(person)}><Info/></button></div><div className="swipe-meta">{distanceCopy(person.distance,privacy)} · {person.match} afinidad</div><p className="swipe-bio">{person.bio}</p><div className="swipe-tags">{person.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div></div><div className="swipe-actions"><button className="swipe-action nope" onClick={()=>onAdvance(false)}><span><X/></span>No me gusta</button><button className="swipe-action skip" onClick={()=>onAdvance(false)}><span><Star/></span>Pasa</button><button className="swipe-action like" onClick={()=>onAdvance(true)}><span><Heart fill="currentColor"/></span>Me gusta</button></div></>:<div className="swipe-empty"><strong>Ya has visto las personas disponibles</strong><button onClick={onBack}>Volver</button></div>}
  </div>;
}
