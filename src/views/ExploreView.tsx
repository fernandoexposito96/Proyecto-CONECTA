import { Search } from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { PlanCards } from '../components/PlanComponents';
import { categories, plans } from '../data/demoData';
import type { Plan } from '../types';

export function ExploreView({onPlan}:{onPlan:(p:Plan)=>void}){
  return <div className="page explore-page"><div className="page-title"><div><h1>Explora</h1><p>Descubre planes cerca de ti</p></div><button><Search/></button></div><div className="filter-row"><button className="active">Cerca de mí</button><button>Hoy</button><button>Este finde</button><button>Ordenar</button></div><div className="category-grid">{categories.map(([name,image])=><button key={name}><img loading="lazy" decoding="async" src={image}/><span/><b><CategoryIcon name={name}/>{name}</b></button>)}</div><section className="section noframe"><div className="section-head"><h2>Recomendados</h2></div><PlanCards items={plans} onPlan={onPlan}/></section></div>
}
