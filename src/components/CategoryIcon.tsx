import { BookOpen, Camera, Coffee, Dumbbell, Film, Gamepad2, GraduationCap, Languages, Mountain, Music2, Palmtree, PartyPopper, PawPrint, Plane, UsersRound, Utensils } from 'lucide-react';

const iconMap = {
  Deporte:Dumbbell,
  Comida:Utensils,
  Café:Coffee,
  Cine:Film,
  Música:Music2,
  Playa:Palmtree,
  Viajes:Plane,
  Senderismo:Mountain,
  Gaming:Gamepad2,
  Fotografía:Camera,
  Idiomas:Languages,
  Fiestas:PartyPopper,
  Familias:UsersRound,
  Estudiantes:GraduationCap,
  Lectura:BookOpen,
  Mascotas:PawPrint,
} as const;

export function CategoryIcon({name}:{name:keyof typeof iconMap}){
  const Icon = iconMap[name];
  return <Icon/>;
}
