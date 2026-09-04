import { Activity, BadgeCheck, Bell, ChevronRight, Compass, Home, MailCheck, Menu, MessageCircle, Moon, Plus, RefreshCw, Search, Shield, Sparkles, Sun, UserCheck } from "lucide-react";
import { createPortal } from "react-dom";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui";
import { EmptyCompact } from "./common";
import type { NotificationRecord, Profile, View } from "../types";
import { formatPlanDate } from "../utils";
import { primaryNavigation } from "../navigation";

type Theme = "light" | "dark";
const avatarFallback = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=84";
export function Sidebar({ active, profile, unread, go }: { active: View; profile: Profile | null; unread: number; go: (view: View) => void; }) {
  return <aside className="sidebar">
    <button className="brand" onClick={() => go("Inicio")}><span className="brand-mark">C</span><span><strong>CONECTA</strong><small>Planes que unen</small></span></button>
    <nav className="side-nav" aria-label="Navegación principal">{primaryNavigation.map(({ label, icon: Icon }) => <button key={label} className={active === label ? "active" : ""} onClick={() => go(label)}><Icon /><span>{label}</span>{label === "Ahora" && <i className="live-dot" />}{label === "Chat" && unread > 0 && <b>{Math.min(unread, 9)}</b>}</button>)}</nav>
    <div className="side-section-label">TU ESPACIO</div>
    <nav className="side-nav compact"><button className={active === "Perfil" ? "active" : ""} onClick={() => go("Perfil")}><UserCheck /><span>Mi perfil</span><BadgeCheck className="verified-icon" /></button><button className={active === "Seguridad" ? "active" : ""} onClick={() => go("Seguridad")}><Shield /><span>Seguridad</span></button><button className={active === "Vida" ? "active" : ""} onClick={() => go("Vida")}><Activity /><span>CONECTA Vida</span><em>PRO</em></button><button className={active === "Conecta+" ? "active" : ""} onClick={() => go("Conecta+")}><Sparkles /><span>CONECTA+</span><em>NUEVO</em></button></nav>
    <button className="email-ready-card" onClick={() => go("Seguridad")}><MailCheck /><span><strong>Cuenta protegida</strong><small>Correo confirmado y Face ID disponible.</small></span><ChevronRight /></button>
    <button className="profile-mini" onClick={() => go("Perfil")}><img src={profile?.avatar_url || avatarFallback} alt="" /><span><strong>{profile?.display_name || "Mi perfil"}</strong><small>{profile?.city || "Configurar ubicación"}</small></span><ChevronRight /></button>
  </aside>;
}

export function Topbar({ query, setQuery, profile, notifications, dataLoading, onRefresh, onCreate, onMenu, theme, onTheme, onNotificationRead, go }: { query: string; setQuery: (value: string) => void; profile: Profile | null; notifications: NotificationRecord[]; dataLoading: boolean; onRefresh: () => Promise<void>; onCreate: () => void; onMenu: () => void; theme: Theme; onTheme: () => void; onNotificationRead: (notification: NotificationRecord) => Promise<void>; go: (view: View) => void; }) {
  return <header className="topbar">
    <button className="mobile-menu-button" onClick={onMenu} aria-label="Abrir menú"><Menu /></button>
    <button className="mobile-brand" onClick={() => go("Inicio")}><span className="brand-mark">C</span><strong>CONECTA</strong></button>
    <label className="search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busca planes, personas, grupos o lugares…" /></label>
    <div className="top-actions">
      <button className="icon-button theme-button" onClick={onTheme} aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}>{theme === "light" ? <Moon /> : <Sun />}</button>
      <button className="icon-button desktop-refresh" onClick={() => void onRefresh()} aria-label="Sincronizar"><RefreshCw className={dataLoading ? "spin" : ""} /></button>
      <Sheet><SheetTrigger asChild><button className="icon-button" aria-label="Notificaciones"><Bell />{notifications.some((item) => !item.read) && <i />}</button></SheetTrigger><SheetContent className="notification-sheet"><SheetHeader><SheetTitle>Notificaciones</SheetTitle><SheetDescription>Cambios de planes, solicitudes y recordatorios.</SheetDescription></SheetHeader><div className="notification-list">{notifications.map((notification) => <button type="button" key={notification.id} className={notification.read ? "notification-item" : "notification-item unread"} onClick={() => void onNotificationRead(notification)}><span>{notification.type.includes("plan") ? "📅" : notification.type.includes("message") ? "💬" : notification.type.includes("connection") ? "🤝" : "✨"}</span><div><strong>{notification.title}</strong><p>{notification.body}</p><small>{formatPlanDate(notification.created_at)}</small></div><ChevronRight /></button>)}{!notifications.length && <EmptyCompact icon={<Bell />} title="Todo al día" text="Aquí aparecerán cambios, recordatorios y solicitudes." />}</div></SheetContent></Sheet>
      <button className="create-button" onClick={onCreate}><Plus /> Crear plan</button>
      <button className="top-profile" onClick={() => go("Perfil")} aria-label="Abrir perfil"><img src={profile?.avatar_url || avatarFallback} alt="" /></button>
    </div>
  </header>;
}

export function MobileNavigation({ active, go, onCreate }: { active: View; go: (view: View) => void; onCreate: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <nav className="bottom-nav" aria-label="Navegación móvil">
      <button className={active === "Inicio" ? "active" : ""} onClick={() => go("Inicio")}><Home /><span>Inicio</span></button>
      <button className={active === "Explorar" ? "active" : ""} onClick={() => go("Explorar")}><Compass /><span>Explora</span></button>
      <button className="floating-create" onClick={onCreate} aria-label="Crear plan"><Plus /></button>
      <button className={active === "Chat" ? "active" : ""} onClick={() => go("Chat")}><MessageCircle /><span>Chat</span></button>
      <button className={active === "Perfil" ? "active" : ""} onClick={() => go("Perfil")}><UserCheck /><span>Perfil</span></button>
    </nav>,
    document.body,
  );
}
