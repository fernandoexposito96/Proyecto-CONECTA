import {
  BadgeCheck,
  Check,
  Flag,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui";
import type { Connection, Profile } from "../types";
import { personCompatibility } from "../utils";
import { avatarFallback } from "../constants/media";

type PersonActions = {
  person: Profile;
  current: Profile | null;
  connection?: Connection;
  onConnect: (person: Profile) => Promise<void>;
  onChat: (person: Profile) => Promise<void>;
};

type PersonCardProps = PersonActions & {
  onReport: (person: Profile) => Promise<void>;
  onBlock: (person: Profile) => Promise<void>;
};

export function PersonCard({
  person,
  current,
  connection,
  onConnect,
  onChat,
  onReport,
  onBlock,
}: PersonCardProps) {
  return <article className="person-card"><img src={person.avatar_url || avatarFallback} alt={person.display_name || "Usuario"} width={480} height={640} loading="lazy" decoding="async" /><div className="person-shade" /><span className="match"><Sparkles /> {personCompatibility(person, current)}%</span><Sheet><SheetTrigger asChild><button className="person-menu" aria-label="Seguridad"><MoreHorizontal /></button></SheetTrigger><SheetContent><SheetHeader><SheetTitle>Seguridad y control</SheetTitle><SheetDescription>Gestiona esta interacción de forma privada.</SheetDescription></SheetHeader><div className="safety-actions"><button onClick={() => void onReport(person)}><Flag /> Reportar perfil</button><button onClick={() => void onBlock(person)}><ShieldAlert /> Bloquear usuario</button></div></SheetContent></Sheet><div className="person-info"><div><h3>{person.display_name || "Usuario"}{person.show_online && person.online && <i />}</h3><span><BadgeCheck /> Perfil de la comunidad</span></div><p><MapPin /> {person.show_location ? person.city || "Ubicación privada" : "Ubicación privada"}</p><small>{person.interests.slice(0, 3).join(" · ") || "Buscando nuevos planes"}</small><div><button className={connection ? "connected" : ""} onClick={() => void onConnect(person)}>{connection ? <><Check /> {connection.status === "accepted" ? "Conectados" : "Pendiente"}</> : "Conectar"}</button><button onClick={() => void onChat(person)} aria-label="Enviar mensaje"><MessageCircle /></button></div></div></article>;
}

export function PersonRow({
  person,
  current,
  connection,
  onConnect,
  onChat,
}: PersonActions) {
  return <article><img src={person.avatar_url || avatarFallback} alt="" /><span><strong>{person.display_name || "Usuario"}</strong><small>{person.interests.slice(0, 2).join(" · ") || person.city || "Nuevos planes"}</small></span><b>{personCompatibility(person, current)}%</b><button onClick={() => void onConnect(person)}>{connection ? <Check /> : <Plus />}</button><button onClick={() => void onChat(person)}><MessageCircle /></button></article>;
}
