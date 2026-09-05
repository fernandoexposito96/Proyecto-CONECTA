import {
  Bike,
  BookOpen,
  BriefcaseBusiness,
  Coffee,
  Dumbbell,
  Footprints,
  Gamepad2,
  GraduationCap,
  Languages,
  Mountain,
  Music2,
  Palette,
  PartyPopper,
  Plane,
  Soup,
  Sparkles,
  UsersRound,
  Volleyball,
} from "lucide-react";

function hashSeed(value: string | number) {
  if (typeof value === "number") return Math.abs(Math.trunc(value));
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function demoVisual(label: string, color: string, variant: number) {
  const hueShift = (variant * 37) % 120;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="hsl(${250 + hueShift} 72% 40%)"/></linearGradient><radialGradient id="r" cx="78%" cy="18%" r="70%"><stop offset="0" stop-color="white" stop-opacity=".34"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient></defs>
    <rect width="1200" height="800" fill="url(#g)"/><rect width="1200" height="800" fill="url(#r)"/><circle cx="${190 + variant * 24}" cy="${210 + variant * 18}" r="118" fill="white" fill-opacity=".13"/><circle cx="${930 - variant * 17}" cy="${570 - variant * 15}" r="210" fill="white" fill-opacity=".08"/><path d="M0 ${650 - variant * 9} C 280 ${520 + variant * 7}, 610 ${760 - variant * 8}, 1200 ${560 + variant * 5} L1200 800 L0 800Z" fill="#0f172a" fill-opacity=".22"/><text x="72" y="590" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="700" fill="white" fill-opacity=".78">CONECTA · DEMO VISUAL</text><text x="72" y="665" font-family="Arial,Helvetica,sans-serif" font-size="72" font-weight="800" fill="white">${label.replace(/&/g, "&amp;")}</text><text x="72" y="720" font-family="Arial,Helvetica,sans-serif" font-size="28" fill="white" fill-opacity=".78">Imagen provisional · variante ${variant + 1}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const cardMedia = (file: string) => `${import.meta.env.BASE_URL}media/cards/${file}`;
const localFallbackMedia = [
  cardMedia("social-city.webp"),
  cardMedia("active-coast.webp"),
  cardMedia("creative-community.webp"),
  cardMedia("safe-planning.webp"),
] as const;

const unsplash = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1100&q=82`;

const realPhotos = {
  running: unsplash("photo-1629185752152-fe65698ddee4"),
  hiking: unsplash("photo-1551632811-561732d1e306"),
  gym: unsplash("photo-1534438327276-14e5300c3a48"),
  racket: unsplash("photo-1622279457486-62dcc4a431d6"),
  cafe: unsplash("photo-1501339847302-ac426a4a7cbb"),
  food: unsplash("photo-1504674900247-0877df9cc836"),
  party: unsplash("photo-1492684223066-81342ee5ff30"),
  music: unsplash("photo-1501386761578-eac5c94b800a"),
  dj: unsplash("photo-1470225620780-dba8ba36b745"),
  museum: unsplash("photo-1643841368618-4aa128ae63c2"),
  friends: unsplash("photo-1529156069898-49953e39b3ac"),
  students: unsplash("photo-1523240795612-9a054b0db644"),
  travel: unsplash("photo-1500530855697-b586d89ba3ee"),
  city: unsplash("photo-1517248135467-4c7edcad34c4"),
  learning: unsplash("photo-1524178232363-1fb2b075b655"),
  books: unsplash("photo-1512820790803-83ca734da794"),
} as const;

function photoPool(primary: string, ...alternates: string[]) {
  return [primary, ...alternates.filter((image) => image !== primary)];
}

export const categories = [
  { label: "Running", icon: Footprints, color: "#22c55e", image: realPhotos.running, images: photoPool(realPhotos.running, realPhotos.hiking, realPhotos.gym) },
  { label: "Ciclismo", icon: Bike, color: "#16a34a", image: realPhotos.travel, images: photoPool(realPhotos.travel, realPhotos.running, realPhotos.hiking) },
  { label: "Senderismo", icon: Mountain, color: "#84cc16", image: realPhotos.hiking, images: photoPool(realPhotos.hiking, realPhotos.running, realPhotos.travel) },
  { label: "Gimnasio", icon: Dumbbell, color: "#10b981", image: realPhotos.gym, images: photoPool(realPhotos.gym, realPhotos.running, realPhotos.racket) },
  { label: "Pádel", icon: Volleyball, color: "#14b8a6", image: realPhotos.racket, images: photoPool(realPhotos.racket, realPhotos.gym, realPhotos.running) },
  { label: "Café", icon: Coffee, color: "#3b82f6", image: realPhotos.cafe, images: photoPool(realPhotos.cafe, realPhotos.food, realPhotos.friends) },
  { label: "Gastronomía", icon: Soup, color: "#f97316", image: realPhotos.food, images: photoPool(realPhotos.food, realPhotos.cafe, realPhotos.city) },
  { label: "Fiesta", icon: PartyPopper, color: "#a855f7", image: realPhotos.party, images: photoPool(realPhotos.party, realPhotos.dj, realPhotos.music) },
  { label: "Música", icon: Music2, color: "#d946ef", image: realPhotos.music, images: photoPool(realPhotos.music, realPhotos.dj, realPhotos.party) },
  { label: "Cultura", icon: Palette, color: "#eab308", image: realPhotos.museum, images: photoPool(realPhotos.museum, realPhotos.books, realPhotos.city) },
  { label: "Juegos", icon: Gamepad2, color: "#06b6d4", image: realPhotos.friends, images: photoPool(realPhotos.friends, realPhotos.students, realPhotos.cafe) },
  { label: "Idiomas", icon: Languages, color: "#0ea5e9", image: realPhotos.friends, images: photoPool(realPhotos.friends, realPhotos.students, realPhotos.learning) },
  { label: "Viajes", icon: Plane, color: "#8b5cf6", image: realPhotos.travel, images: photoPool(realPhotos.travel, realPhotos.friends, realPhotos.city) },
  { label: "Networking", icon: BriefcaseBusiness, color: "#64748b", image: realPhotos.learning, images: photoPool(realPhotos.learning, realPhotos.students, realPhotos.cafe) },
  { label: "Familias", icon: UsersRound, color: "#ec4899", image: realPhotos.friends, images: photoPool(realPhotos.friends, realPhotos.travel, realPhotos.cafe) },
  { label: "Estudiantes", icon: GraduationCap, color: "#6366f1", image: realPhotos.students, images: photoPool(realPhotos.students, realPhotos.learning, realPhotos.books) },
  { label: "Nuevos en la ciudad", icon: Sparkles, color: "#f43f5e", image: realPhotos.city, images: photoPool(realPhotos.city, realPhotos.friends, realPhotos.cafe) },
  { label: "Lectura", icon: BookOpen, color: "#f59e0b", image: realPhotos.books, images: photoPool(realPhotos.books, realPhotos.cafe, realPhotos.students) },
] as const;

export const planTemplates = ["Corremos 5 kilómetros","Desayuno el domingo","Busco gente para jugar al pádel","Cena para conocer gente nueva","Salir de fiesta","Plan improvisado ahora","Busco compañero para entrenar","Quiero hacer senderismo","Busco gente para practicar idiomas","Ruta en bici al atardecer","Tarde de juegos de mesa","Concierto y algo después","Visita cultural y café","Escapada de un día","Networking sin corbata"];

export const fallbackImage = localFallbackMedia[0];
const categoryCounters = new Map<string, number>();
export function categoryImage(category?: string | null, variant?: string | number | null) { const item = categories.find((candidate) => candidate.label === category) ?? categories[0]; const images = item.images; const index = variant == null ? categoryCounters.get(item.label) ?? 0 : hashSeed(variant); if (variant == null) categoryCounters.set(item.label, index + 1); return images[index % images.length] ?? fallbackImage; }
export function visualFallback(label = "CONECTA", variant: string | number = label) { const item = categories.find((candidate) => label.toLowerCase().includes(candidate.label.toLowerCase())); return demoVisual(item?.label ?? label.slice(0, 28), item?.color ?? "#7c3aed", hashSeed(variant) % 5); }
export function categoryColor(category?: string | null) { return categories.find((item) => item.label === category)?.color ?? "#8b5cf6"; }
