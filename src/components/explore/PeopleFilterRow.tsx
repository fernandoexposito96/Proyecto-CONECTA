import type { PeopleFilter } from '../../types';

export function PeopleFilterRow({value,onChange,locationAllowed}:{value:PeopleFilter;onChange:(value:PeopleFilter)=>void;locationAllowed:boolean}){
  return <div className="swipe-filter-row people-grid-filters">
    <button disabled={!locationAllowed} className={value==='near'?'active':''} onClick={()=>onChange('near')}>Cerca de mí</button>
    <button className={value==='age'?'active':''} onClick={()=>onChange('age')}>Edad</button>
    <button className={value==='interests'?'active':''} onClick={()=>onChange('interests')}>Intereses</button>
    <button className={value==='match'?'active':''} onClick={()=>onChange('match')}>Afinidad</button>
  </div>;
}
