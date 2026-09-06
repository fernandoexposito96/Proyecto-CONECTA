import { lazy, Suspense } from "react";
import {
  CalendarDays,
  Check,
  MapPin,
  Plus,
  ShieldCheck,
  UserRoundPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { categoryImage } from "../catalog";
import { EmptyFeature, PageHero } from "../components/common";
import { ScreenSkeleton } from "../components/AppResilience";
import type { Community, CommunityMember } from "../types";

const CommunityActivityTools = lazy(() =>
  import("./CommunityActivityTools").then((module) => ({
    default: module.CommunityActivityTools,
  })),
);

type GroupsViewProps = {
  communities: Community[];
  members: CommunityMember[];
  userId: string;
  onCreate: () => void;
  onJoin: (community: Community) => Promise<void>;
};

export function GroupsView({
  communities,
  members,
  userId,
  onCreate,
  onJoin,
}: GroupsViewProps) {
  return <div className="view-page">
    <PageHero eyebrow="COMUNIDADES RECURRENTES" title="Grupos para volver a encontrarse" text="Running semanal, pádel, idiomas, gastronomía, viajes, familias y mucho más." icon={<UsersRound />} action={<button onClick={onCreate}><Plus /> Crear grupo</button>} />
    <div className="group-chips"><button className="active">Recomendados</button><button>Semanal</button><button>Mensual</button><button>Cerca de mí</button><button>Nuevos</button></div>
    {communities.length ? <div className="groups-grid">{communities.map((community) => {
      const communityMemberships = members.filter((member) => member.community_id === community.id && member.status === "active");
      const mine = members.find((member) => member.community_id === community.id && member.user_id === userId);
      return <article className="group-card" key={community.id}><div className="group-cover"><img src={community.image_url || categoryImage(community.category)} alt="" width={1280} height={853} loading="lazy" decoding="async" /><span>{community.category || "Comunidad"}</span><b>{community.organizer_tier}</b></div><div className="group-body"><h2>{community.name}</h2><p>{community.description || "Una comunidad para compartir actividades reales."}</p><div className="group-facts"><span><MapPin />{community.location_name || "Ubicación variable"}</span><span><CalendarDays />{community.recurrence_rule || "Próximas fechas en el calendario"}</span><span><Users />{communityMemberships.length} miembros</span></div><div className="group-rules"><ShieldCheck /> {community.rules[0] || "Respeto, puntualidad y convivencia"}</div><button className={mine ? "joined" : ""} onClick={() => void onJoin(community)}>{mine ? <><Check /> Miembro</> : <><UserRoundPlus /> Unirme al grupo</>}</button></div></article>;
    })}</div> : <EmptyFeature icon={<UsersRound />} title="Crea la primera comunidad" text="Organiza una actividad semanal o mensual con chat, calendario, normas y coorganizadores." action="Crear grupo" onAction={onCreate} />}
    <Suspense fallback={<ScreenSkeleton />}><CommunityActivityTools communities={communities} members={members} userId={userId} /></Suspense>
  </div>;
}
