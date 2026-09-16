import type { ChatContact } from '../components/explore/PersonDetailCard';
import type { ExploreFilter, Plan } from '../types';

/**
 * Explora starts from a deliberately clean canvas.
 * Global app chrome (top controls and bottom navigation) is rendered by the app shell,
 * so this view must not duplicate it or keep legacy Explore layers underneath.
 */
export function ExploreView(_props:{
  onPlan:(plan:Plan)=>void;
  extraPlans?:Plan[];
  initialFilter?:ExploreFilter;
  initialCategory?:string|null;
  onChat:(contact:ChatContact)=>void;
}){
  return <div className="page explore-page explore-blank" aria-label="Explora" />;
}
