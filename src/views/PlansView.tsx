import { CalendarDays, Plus } from "lucide-react";
import { categories } from "../catalog";
import { PlanCard } from "../components/PlanCard";
import { PageHero, PlansEmpty } from "../components/common";
import type { Plan, PlanMember, Profile, SavedItem } from "../types";

type PlansViewProps = {
  plans: Plan[];
  profile: Profile | null;
  members: PlanMember[];
  myMemberships: PlanMember[];
  savedItems: SavedItem[];
  category: string;
  setCategory: (category: string) => void;
  onPlan: (plan: Plan) => void;
  onJoin: (plan: Plan) => Promise<void>;
  onSave: (plan: Plan) => Promise<void>;
  onCreate: () => void;
};

export function PlansView({
  plans,
  profile,
  members,
  myMemberships,
  savedItems,
  category,
  setCategory,
  onPlan,
  onJoin,
  onSave,
  onCreate,
}: PlansViewProps) {
  return <div className="view-page">
    <PageHero eyebrow="EXPERIENCIAS REALES" title="Planes que sí ocurren" text="Plazas, nivel, coste, ambiente, asistentes y seguridad antes de apuntarte." icon={<CalendarDays />} action={<button onClick={onCreate}><Plus /> Crear plan</button>} />
    <div className="plan-dashboard"><div><strong>{plans.length}</strong><span>Planes disponibles</span></div><div><strong>{myMemberships.filter((item) => ["attending", "requested", "waitlist"].includes(item.status)).length}</strong><span>Próximas asistencias</span></div><div><strong>{myMemberships.filter((item) => item.status === "waitlist").length}</strong><span>En lista de espera</span></div><div><strong>{savedItems.filter((item) => item.item_type === "plan").length}</strong><span>Guardados</span></div></div>
    <div className="filter-pills"><button className={category === "Todos" ? "active" : ""} onClick={() => setCategory("Todos")}>Todos</button>{categories.map(({ label }) => <button key={label} className={category === label ? "active" : ""} onClick={() => setCategory(label)}>{label}</button>)}</div>
    {plans.length ? <div className="plans-grid">{plans.map((plan) => <PlanCard key={plan.id} plan={plan} profile={profile} members={members} membership={myMemberships.find((item) => item.plan_id === plan.id)} saved={savedItems.some((item) => item.item_type === "plan" && item.item_id === plan.id)} onOpen={onPlan} onJoin={onJoin} onSave={onSave} />)}</div> : <PlansEmpty onCreate={onCreate} />}
  </div>;
}
