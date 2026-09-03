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

function imagePool(base: string, label: string, color: string) {
  return [base, ...Array.from({ length: 5 }, (_, index) => demoVisual(label, color, index))];
}

export const categories = [
  { label: "Running", icon: Footprints, color: "#22c55e", image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1100&q=86", "Running", "#22c55e") },
  { label: "Ciclismo", icon: Bike, color: "#16a34a", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1100&q=86", "Ciclismo", "#16a34a") },
  { label: "Senderismo", icon: Mountain, color: "#84cc16", image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1100&q=86", "Senderismo", "#84cc16") },
  { label: "Gimnasio", icon: Dumbbell, color: "#10b981", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1100&q=86", "Gimnasio", "#10b981") },
  { label: "Pádel", icon: Volleyball, color: "#14b8a6", image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1100&q=86", "Pádel", "#14b8a6") },
  { label: "Café", icon: Coffee, color: "#3b82f6", image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1100&q=86", "Café", "#3b82f6") },
  { label: "Gastronomía", icon: Soup, color: "#f97316", image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1100&q=86", "Gastronomía", "#f97316") },
  { label: "Fiesta", icon: PartyPopper, color: "#a855f7", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1100&q=86", "Fiesta", "#a855f7") },
  { label: "Música", icon: Music2, color: "#d946ef", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1100&q=86", "Música", "#d946ef") },
  { label: "Cultura", icon: Palette, color: "#eab308", image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1100&q=86", "Cultura", "#eab308") },
  { label: "Juegos", icon: Gamepad2, color: "#06b6d4", image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=1100&q=86", "Juegos", "#06b6d4") },
  { label: "Idiomas", icon: Languages, color: "#0ea5e9", image: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1100&q=86", "Idiomas", "#0ea5e9") },
  { label: "Viajes", icon: Plane, color: "#8b5cf6", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1100&q=86", "Viajes", "#8b5cf6") },
  { label: "Networking", icon: BriefcaseBusiness, color: "#64748b", image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1100&q=86", "Networking", "#64748b") },
  { label: "Familias", icon: UsersRound, color: "#ec4899", image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1100&q=86", "Familias", "#ec4899") },
  { label: "Estudiantes", icon: GraduationCap, color: "#6366f1", image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1100&q=86", "Estudiantes", "#6366f1") },
  { label: "Nuevos en la ciudad", icon: Sparkles, color: "#f43f5e", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=86", "Nuevos en la ciudad", "#f43f5e") },
  { label: "Lectura", icon: BookOpen, color: "#f59e0b", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1100&q=86", images: imagePool("https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1100&q=86", "Lectura", "#f59e0b") },
] as const;

export const planTemplates = ["Corremos 5 kilómetros","Desayuno el domingo","Busco gente para jugar al pádel","Cena para conocer gente nueva","Salir de fiesta","Plan improvisado ahora","Busco compañero para entrenar","Quiero hacer senderismo","Busco gente para practicar idiomas","Ruta en bici al atardecer","Tarde de juegos de mesa","Concierto y algo después","Visita cultural y café","Escapada de un día","Networking sin corbata"];

export const fallbackImage = demoVisual("CONECTA", "#7c3aed", 0);
const categoryCounters = new Map<string, number>();
export function categoryImage(category?: string | null, variant?: string | number | null) { const item = categories.find((candidate) => candidate.label === category) ?? categories[0]; const images = item.images; const index = variant == null ? categoryCounters.get(item.label) ?? 0 : hashSeed(variant); if (variant == null) categoryCounters.set(item.label, index + 1); return images[index % images.length] ?? fallbackImage; }
export function visualFallback(label = "CONECTA", variant: string | number = label) { const item = categories.find((candidate) => label.toLowerCase().includes(candidate.label.toLowerCase())); return demoVisual(item?.label ?? label.slice(0, 28), item?.color ?? "#7c3aed", hashSeed(variant) % 5); }
export function categoryColor(category?: string | null) { return categories.find((item) => item.label === category)?.color ?? "#8b5cf6"; }
