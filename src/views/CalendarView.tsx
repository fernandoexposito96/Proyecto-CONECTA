import {
  CalendarDays,
  ChevronRight,
  Download,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { categoryColor } from "../catalog";
import { EmptyCompact, PageHero, SectionTitle } from "../components/common";
import { exportSocialCalendar } from "../socialCalendar";
import type { Community, CommunityMember, Plan, PlanMember } from "../types";

type CalendarViewProps = {
  plans: Plan[];
  myMemberships: PlanMember[];
  communities: Community[];
  communityMembers: CommunityMember[];
  onPlan: (plan: Plan) => void;
};

export function CalendarView({
  plans,
  myMemberships,
  communities,
  communityMembers,
  onPlan,
}: CalendarViewProps) {
  const joined = plans.filter((plan) =>
    myMemberships.some((member) => member.plan_id === plan.id),
  );
  const myGroups = communities.filter((community) =>
    communityMembers.some((member) => member.community_id === community.id),
  );
  const currentMonth = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="view-page">
      <PageHero
        eyebrow="TU AGENDA SOCIAL"
        title="Nada se queda en el aire"
        text="Planes confirmados, listas de espera, grupos recurrentes y recordatorios."
        icon={<CalendarDays />}
        action={
          <button onClick={() => exportSocialCalendar(joined, myGroups)}>
            <Download /> Exportar agenda
          </button>
        }
      />
      <div className="calendar-layout">
        <section className="month-card">
          <header>
            <button aria-label="Mes anterior">‹</button>
            <strong>{currentMonth}</strong>
            <button aria-label="Mes siguiente">›</button>
          </header>
          <div className="calendar-week">
            <b>L</b><b>M</b><b>X</b><b>J</b><b>V</b><b>S</b><b>D</b>
            {Array.from({ length: 35 }, (_, index) => {
              const day = index - 2;
              const events = joined.filter(
                (plan) => plan.starts_at && new Date(plan.starts_at).getDate() === day,
              );
              return (
                <button
                  key={index}
                  disabled={day < 1 || day > 31}
                  className={events.length ? "has-event" : ""}
                >
                  <span>{day > 0 && day <= 31 ? day : ""}</span>
                  {events.slice(0, 2).map((plan) => (
                    <i key={plan.id} style={{ background: categoryColor(plan.category) }} />
                  ))}
                </button>
              );
            })}
          </div>
        </section>
        <aside className="agenda-card">
          <header><span>PRÓXIMOS</span><strong>Tu agenda</strong></header>
          {joined.map((plan) => {
            const membership = myMemberships.find(
              (member) => member.plan_id === plan.id,
            );
            return (
              <article key={plan.id}>
                <div className="agenda-date">
                  <strong>
                    {plan.starts_at ? new Date(plan.starts_at).getDate() : "—"}
                  </strong>
                  <span>
                    {plan.starts_at
                      ? new Date(plan.starts_at).toLocaleDateString("es-ES", {
                          month: "short",
                        })
                      : "Fecha"}
                  </span>
                </div>
                <div>
                  <strong>{plan.title}</strong>
                  <small><MapPin />{plan.location_name || "Por confirmar"}</small>
                  <span className={`status-pill ${membership?.status}`}>
                    {membership?.status === "attending"
                      ? "Asistencia confirmada"
                      : membership?.status === "waitlist"
                        ? "Lista de espera"
                        : membership?.status === "requested"
                          ? "Pendiente de aprobación"
                          : "Me interesa"}
                  </span>
                </div>
                <button onClick={() => onPlan(plan)}><ChevronRight /></button>
              </article>
            );
          })}
          {!joined.length && (
            <EmptyCompact
              icon={<CalendarDays />}
              title="Tu agenda está libre"
              text="Cuando te apuntes a un plan, lo verás aquí y podrás añadirlo al calendario del móvil."
            />
          )}
        </aside>
      </div>
      {myGroups.length > 0 && (
        <section className="section-block">
          <SectionTitle
            eyebrow="ACTIVIDADES RECURRENTES"
            title="Calendarios de tus grupos"
          />
          <div className="recurring-row">
            {myGroups.map((group) => (
              <article key={group.id}>
                <span><RefreshCw /></span>
                <div>
                  <strong>{group.name}</strong>
                  <small>{group.recurrence_rule || "Próxima actividad por confirmar"}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
