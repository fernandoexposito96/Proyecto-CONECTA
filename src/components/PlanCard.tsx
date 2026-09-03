import { CalendarDays, Check, Heart, MapPin, Sparkles, UserRoundPlus, Zap } from "lucide-react";
import { categoryColor, categoryImage } from "../catalog";
import type { Plan, PlanMember, Profile } from "../types";
import { distanceKm, formatAtmosphere, formatLevel, formatMoney, formatPlanDate, planCompatibility } from "../utils";

export function PlanCard({
  plan,
  profile,
  members,
  membership,
  saved,
  onOpen,
  onJoin,
  onSave,
  urgent = false,
}: {
  plan: Plan;
  profile: Profile | null;
  members: PlanMember[];
  membership?: PlanMember;
  saved: boolean;
  onOpen: (plan: Plan) => void;
  onJoin: (plan: Plan) => Promise<void>;
  onSave: (plan: Plan) => Promise<void>;
  urgent?: boolean;
}) {
  const attending = members.filter((member) => member.plan_id === plan.id && ["attending", "attended"].includes(member.status)).length;
  const available = plan.max_people == null ? null : Math.max(plan.max_people - attending, 0);
  const distance = distanceKm(profile?.latitude ?? null, profile?.longitude ?? null, plan.latitude, plan.longitude);
  const statusLabel = membership?.status === "attending" ? "Voy a asistir" : membership?.status === "waitlist" ? "Lista de espera" : membership?.status === "requested" ? "Solicitud enviada" : membership ? "Me interesa" : "Me apunto";

  return <article className={`plan-card ${urgent ? "urgent" : ""}`} style={{ borderColor: categoryColor(plan.category) }}>
    <button className="plan-image" onClick={() => onOpen(plan)}>
      <img src={plan.image_url || categoryImage(plan.category)} alt={plan.title} />
      <span className="type-pill" style={{ background: categoryColor(plan.category) }}>{plan.category || "Plan"}</span>
      {(urgent || plan.is_spontaneous) && <span className="urgent-pill"><Zap /> AHORA</span>}
      {plan.newcomer_friendly && <span className="newcomer-pill"><Sparkles /> PRIMER PLAN</span>}
      <div className="compatibility-ring"><strong>{planCompatibility(plan, profile)}%</strong><small>compatible</small></div>
    </button>
    <div className="plan-body">
      <div className="plan-topline"><span><CalendarDays /> {formatPlanDate(plan.starts_at)}</span><button className={saved ? "saved" : ""} onClick={() => void onSave(plan)} aria-label="Guardar plan"><Heart fill={saved ? "currentColor" : "none"} /></button></div>
      <button className="plan-title" onClick={() => onOpen(plan)}><h3>{plan.title}</h3></button>
      <p className="plan-location"><MapPin /> {plan.location_name || "Punto por confirmar"}{distance != null && <b>· {distance.toFixed(1)} km</b>}</p>
      <div className="plan-tags"><span>{formatLevel(plan.level)}</span><span>{formatAtmosphere(plan.atmosphere)}</span><span>{formatMoney(plan.cost_cents, plan.currency)}</span></div>
      <div className="attendance-row"><div className="avatar-stack">{Array.from({ length: Math.min(attending, 3) }, (_, index) => <span key={index}>{String.fromCharCode(65 + index)}</span>)}</div><div><strong>{attending} personas</strong><small>{available == null ? "Sin límite" : `${available} plazas disponibles`}</small></div>{available === 1 && <em>¡Última plaza!</em>}</div>
      <button className={`join-plan ${membership ? "joined" : ""}`} onClick={() => void onJoin(plan)}>{membership ? <Check /> : <UserRoundPlus />}{statusLabel}</button>
    </div>
  </article>;
}
