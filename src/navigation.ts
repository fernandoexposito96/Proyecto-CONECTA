import { CalendarDays, Compass, Home, ListChecks, Map, MessageCircle, UsersRound, Zap } from "lucide-react";
import type { View } from "./types";

export const primaryNavigation: Array<{ label: View; icon: typeof Home }> = [
  { label: "Inicio", icon: Home },
  { label: "Explorar", icon: Compass },
  { label: "Ahora", icon: Zap },
  { label: "Mapa", icon: Map },
  { label: "Planes", icon: CalendarDays },
  { label: "Grupos", icon: UsersRound },
  { label: "Chat", icon: MessageCircle },
  { label: "Calendario", icon: ListChecks },
];
