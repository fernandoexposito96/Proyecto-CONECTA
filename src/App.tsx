import {
  type FormEvent,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  Activity,
  BadgeCheck,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Coffee,
  Compass,
  Download,
  Dumbbell,
  Euro,
  Flag,
  Fingerprint,
  Footprints,
  Heart,
  LoaderCircle,
  LogOut,
  MailCheck,
  Map,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Navigation,
  Plus,
  RefreshCw,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  TimerReset,
  UserCheck,
  UserRoundPlus,
  Users,
  UsersRound,
  WalletCards,
  Zap,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, Sheet, SheetContent,
  SheetDescription, SheetHeader, SheetTitle, SheetTrigger, Tabs, TabsContent,
  TabsList, TabsTrigger, Toaster,
} from "./ui";
import { toast } from "./toast";
import { supabase } from "./supabase";
import { demoProfiles, isDemoModeEnabled, setDemoModeEnabled } from "./demoMode";
import { loadConectaData } from "./data/loadConectaData";
import { refreshConnections, refreshConversations, refreshPlanMembers, refreshSavedItems } from "./data/refreshConectaSlices";
import { exportSocialCalendar } from "./socialCalendar";
import { categories, categoryColor, categoryImage, planTemplates } from "./catalog";
import { EmptyCompact, EmptyFeature, Field, PageHero, PlansEmpty, SectionTitle } from "./components/common";
import { MobileNavigation, Sidebar, Topbar } from "./components/AppChrome";
import { primaryNavigation } from "./navigation";
import { RetryState, ScreenSkeleton } from "./components/AppResilience";
import { AuthScreen, EmailVerificationScreen, LoadingScreen, OnboardingScreen } from "./views/AuthFlowViews";
import { ReputationReviews } from "./components/ReputationReviews";
import type {
  Community,
  CommunityMember,
  Connection,
  Conversation,
  Message,
  NotificationRecord,
  Plan,
  PlanMember,
  Profile,
  ProfileTrust,
  SavedItem,
  View,
} from "./types";
import {
  distanceKm,
  downloadPlanCalendar,
  formatAtmosphere,
  formatLevel,
  formatMoney,
  formatPlanDate,
  mapEmbedUrl,
  personCompatibility,
  planCompatibility,
  yearsOld,
} from "./utils";

type AuthMode = "signin" | "signup";
type Theme = "light" | "dark";
type Filters = {
  date: "all" | "today" | "weekend";
  distance: number;
  level: string;
  price: "all" | "free" | "paid";
  verified: boolean;
};

const initialFilters: Filters = {
  date: "all",
  distance: 25,
  level: "all",
  price: "all",
  verified: false,
};

const avatarFallback =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=84";

const SecurityView = lazy(() => import("./views/SecurityView").then((m) => ({ default: m.SecurityView })));
const ProductHub = lazy(() => import("./views/ProductHub").then((m) => ({ default: m.ProductHub })));
const LifeView = lazy(() => import("./views/StatusViews").then((m) => ({ default: m.LifeView })));
const AdvancedChatView = lazy(() => import("./views/AdvancedChatView").then((m) => ({ default: m.AdvancedChatView })));
const CommunityActivityTools = lazy(() => import("./views/CommunityActivityTools").then((m) => ({ default: m.CommunityActivityTools })));

export default function ConectaApp() {
  const demoModeEnabled = isDemoModeEnabled();
  const [theme, setTheme] = useState<Theme>(() =>
    window.localStorage.getItem("conecta-theme") === "dark" ? "dark" : "light",
  );
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trust, setTrust] = useState<ProfileTrust | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planMembers, setPlanMembers] = useState<PlanMember[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const lastLoadRef = useRef<{ userId: string; at: number } | null>(null);
  const [active, setActive] = useState<View>("Inicio");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedMapPlan, setSelectedMapPlan] = useState<Plan | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [referenceNow, setReferenceNow] = useState(0);

  const user = session?.user ?? null;
  const emailVerified = Boolean(user?.email_confirmed_at || trust?.email_verified);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("conecta-theme", theme);
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) toast.error("No se pudo recuperar la sesión");
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadData = useCallback(async (currentUser: User) => {
  const now = Date.now();
  if (lastLoadRef.current?.userId === currentUser.id && now - lastLoadRef.current.at < 800) return;
  lastLoadRef.current = { userId: currentUser.id, at: now };
  setDataLoading(true);
  setDataError(null);
  try {
    const snapshot = await loadConectaData(currentUser, demoModeEnabled);
    if (snapshot.errorMessage) {
      setDataError(snapshot.errorMessage);
      toast.error(`No se pudo sincronizar todo: ${snapshot.errorMessage}`);
    }
    setProfile(snapshot.profile);
    setTrust(snapshot.trust);
    setPlans(snapshot.plans);
    setPlanMembers(snapshot.planMembers);
    setProfiles(snapshot.profiles);
    setConnections(snapshot.connections);
    setCommunities(snapshot.communities);
    setCommunityMembers(snapshot.communityMembers);
    setConversations(snapshot.conversations);
    setSelectedConversation((current) => current ?? snapshot.conversations[0]?.id ?? null);
    setNotifications(snapshot.notifications);
    setSavedItems(snapshot.savedItems);
    setReferenceNow(Date.now());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado al sincronizar";
    setDataError(message);
    toast.error(`No se pudo sincronizar todo: ${message}`);
  } finally {
    setDataLoading(false);
  }
}, [demoModeEnabled]);

  useEffect(() => {
    if (!user || !emailVerified) return;
    const timer = window.setTimeout(() => void loadData(user), 0);
    return () => window.clearTimeout(timer);
  }, [emailVerified, loadData, user]);

  useEffect(() => {
    if (!selectedConversation || !user) {
      const timer = window.setTimeout(() => setMessages([]), 0);
      return () => window.clearTimeout(timer);
    }
    let mounted = true;
    void supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", selectedConversation)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) toast.error("No se pudieron cargar los mensajes");
        const loadedMessages = (data as Message[] | null) ?? [];
        setMessages(loadedMessages);
        const receipts = loadedMessages.filter((message) => message.sender_id !== user.id).map((message) => ({ message_id: message.id, user_id: user.id }));
        if (receipts.length) void supabase.from("message_reads").upsert(receipts, { onConflict: "message_id,user_id", ignoreDuplicates: true });
      });

    const channel = supabase
      .channel(`messages:${selectedConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((items) => (items.some((item) => item.id === incoming.id) ? items : [...items, incoming]));
          if (incoming.sender_id !== user.id) void supabase.from("message_reads").upsert({ message_id: incoming.id, user_id: user.id }, { onConflict: "message_id,user_id", ignoreDuplicates: true });
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        const incoming = payload.new as NotificationRecord;
        setNotifications((items) => items.some((item) => item.id === incoming.id) ? items : [incoming, ...items].slice(0, 30));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user]);

  const myMemberships = useMemo(
    () => planMembers.filter((member) => member.user_id === user?.id),
    [planMembers, user?.id],
  );

  const visiblePlans = useMemo(() => {
    return plans.filter((plan) => {
      const haystack = `${plan.title} ${plan.description ?? ""} ${plan.category ?? ""} ${plan.location_name ?? ""}`.toLowerCase();
      if (query && !haystack.includes(query.toLowerCase())) return false;
      if (category !== "Todos" && plan.category !== category) return false;
      if (filters.level !== "all" && plan.level !== filters.level && plan.level !== "all") return false;
      if (filters.price === "free" && plan.cost_cents > 0) return false;
      if (filters.price === "paid" && plan.cost_cents === 0) return false;
      const distance = distanceKm(profile?.latitude ?? null, profile?.longitude ?? null, plan.latitude, plan.longitude);
      if (distance != null && distance > filters.distance) return false;
      if (filters.date !== "all" && plan.starts_at) {
        const start = new Date(plan.starts_at);
        const today = new Date();
        if (filters.date === "today" && start.toDateString() !== today.toDateString()) return false;
        if (filters.date === "weekend" && ![0, 6].includes(start.getDay())) return false;
      }
      if (plan.expires_at && new Date(plan.expires_at).getTime() < referenceNow) return false;
      return true;
    });
  }, [category, filters, plans, profile, query, referenceNow]);

  const nowPlans = useMemo(() => {
    const twoDays = referenceNow + 48 * 60 * 60 * 1000;
    return plans.filter((plan) => {
      const start = plan.starts_at ? new Date(plan.starts_at).getTime() : Number.POSITIVE_INFINITY;
      if (plan.expires_at && new Date(plan.expires_at).getTime() < referenceNow) return false;
      return plan.is_spontaneous || (start >= referenceNow && start <= twoDays);
    });
  }, [plans, referenceNow]);

  const go = (view: View) => {
    setActive(view);
    setQuery("");
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refresh = async () => {
    if (!user) return;
    await loadData(user);
    toast.success("CONECTA está sincronizada");
  };

  const toggleDemoMode = () => {
    const next = !demoModeEnabled;
    setDemoModeEnabled(next);
    toast.success(next ? "Modo Demo activado" : "Modo Demo desactivado");
    window.location.reload();
  };

  const joinPlan = async (plan: Plan) => {
    if (!user) return;
    const membership = myMemberships.find((item) => item.plan_id === plan.id);
    const operation = membership
      ? supabase.from("plan_members").delete().eq("plan_id", plan.id).eq("user_id", user.id)
      : supabase.from("plan_members").insert({ plan_id: plan.id, user_id: user.id, role: "participant" });
    const { error } = await operation;
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(membership ? "Has salido del plan" : "Tu asistencia se ha registrado");
    if (!membership && "vibrate" in navigator) navigator.vibrate([35, 25, 55]);
    setPlanMembers(await refreshPlanMembers());
  };

  const savePlan = async (plan: Plan) => {
    if (!user) return;
    const saved = savedItems.find((item) => item.item_type === "plan" && item.item_id === plan.id);
    const operation = saved
      ? supabase.from("saved_items").delete().eq("id", saved.id)
      : supabase.from("saved_items").insert({ user_id: user.id, item_type: "plan", item_id: plan.id });
    const { error } = await operation;
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(saved ? "Plan eliminado de guardados" : "Plan guardado");
    setSavedItems(await refreshSavedItems(user.id));
  };

  const connectWith = async (person: Profile) => {
    if (!user) return;
    const existing = connections.find(
      (connection) =>
        (connection.requester_id === user.id && connection.receiver_id === person.id) ||
        (connection.receiver_id === user.id && connection.requester_id === person.id),
    );
    if (existing?.status === "pending" && existing.receiver_id === user.id) {
      const { error } = await supabase.from("connections").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", existing.id);
      if (error) return toast.error(error.message);
      toast.success("Conexión aceptada");
    } else if (existing) {
      const { error } = await supabase.from("connections").delete().eq("id", existing.id);
      if (error) return toast.error(error.message);
      toast.success(existing.status === "pending" ? "Solicitud cancelada" : "Conexión eliminada");
    } else {
      const { error } = await supabase.from("connections").insert({ requester_id: user.id, receiver_id: person.id });
      if (error) return toast.error(error.message);
      toast.success("Solicitud enviada");
    }
    setConnections(await refreshConnections());
  };

  const openDirectChat = async (person: Profile) => {
    if (!user) return;
    const { data, error } = await supabase.rpc("get_or_create_direct_conversation", { other_user: person.id });
    if (error) return toast.error(error.message);
    setConversations(await refreshConversations());
    setSelectedConversation(String(data));
    setActive("Chat");
  };

  const reportPerson = async (person: Profile) => {
    if (!user) return;
    const reason = window.prompt("Motivo del reporte (sin datos sensibles):");
    if (!reason?.trim()) return;
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: person.id,
      reason: reason.trim(),
    });
    if (error) return toast.error(error.message);
    toast.success("Reporte enviado para revisión");
  };

  const blockPerson = async (person: Profile) => {
    if (!user) return;
    const { error } = await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: person.id });
    if (error) return toast.error(error.message);
    await supabase.from("connections").delete().or(`and(requester_id.eq.${user.id},receiver_id.eq.${person.id}),and(requester_id.eq.${person.id},receiver_id.eq.${user.id})`);
    toast.success(`${person.display_name ?? "Usuario"} ha sido bloqueado y retirado de tus conexiones`);
    setConnections(await refreshConnections());
  };

  if (!authReady) return <LoadingScreen label="Preparando tu comunidad" />;

  if (!session || !user) {
    return (
      <AuthScreen
        mode={authMode}
        pendingEmail={pendingEmail}
        setMode={setAuthMode}
        setPendingEmail={setPendingEmail}
      />
    );
  }

  if (!emailVerified) {
    return <EmailVerificationScreen user={session.user} />;
  }

  if (!dataLoading && (!profile || !profile.onboarding_completed)) {
    return (
      <OnboardingScreen
        user={session.user}
        profile={profile}
        onComplete={async () => loadData(session.user)}
      />
    );
  }

  if (dataLoading && !profile) return <main className="centered-flow"><ScreenSkeleton cards={6} /></main>;
  if (dataError && !profile) return <main className="centered-flow"><RetryState text={dataError} onRetry={() => void loadData(user)} /></main>;

  return (
    <div className="app-shell">
      <Toaster position="top-center" richColors />
      <Sidebar
        active={active}
        profile={profile}
        unread={notifications.filter((notification) => !notification.read).length}
        go={go}
      />
      <main className="main-content">
        <Topbar
          query={query}
          setQuery={setQuery}
          profile={profile}
          notifications={notifications}
          dataLoading={dataLoading}
          onRefresh={refresh}
          onCreate={() => setCreatePlanOpen(true)}
          onMenu={() => setMobileMenuOpen(true)}
          theme={theme}
          onTheme={() => setTheme((current) => current === "light" ? "dark" : "light")}
          onNotificationRead={async (notification) => {
            if (!notification.read) {
              const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notification.id).eq("user_id", user.id);
              if (error) return toast.error(error.message);
              setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
            }
            if (notification.type.includes("message")) go("Chat");
            else if (notification.type.includes("plan")) go("Planes");
            else if (notification.type.includes("connection")) go("Conecta+");
          }}
          go={go}
        />
        <div className="content-wrap">
          {active === "Inicio" && (
            <HomeView
              profile={profile}
              trust={trust}
              plans={visiblePlans}
              members={planMembers}
              myMemberships={myMemberships}
              profiles={profiles}
              connections={connections}
              savedItems={savedItems}
              go={go}
              onCreate={() => setCreatePlanOpen(true)}
              onPlan={setSelectedPlan}
              onJoin={joinPlan}
              onSave={savePlan}
              onConnect={connectWith}
              onChat={openDirectChat}
            />
          )}
          {active === "Explorar" && (
            <ExploreView
              plans={visiblePlans}
              profiles={profiles}
              profile={profile}
              category={category}
              setCategory={setCategory}
              filters={filters}
              setFilters={setFilters}
              connections={connections}
              members={planMembers}
              myMemberships={myMemberships}
              savedItems={savedItems}
              userId={user.id}
              onPlan={setSelectedPlan}
              onJoin={joinPlan}
              onSave={savePlan}
              onConnect={connectWith}
              onChat={openDirectChat}
              onReport={reportPerson}
              onBlock={blockPerson}
            />
          )}
          {active === "Ahora" && (
            <NowView
              plans={nowPlans}
              profile={profile}
              members={planMembers}
              myMemberships={myMemberships}
              savedItems={savedItems}
              onPlan={setSelectedPlan}
              onJoin={joinPlan}
              onSave={savePlan}
              onCreate={() => setCreatePlanOpen(true)}
            />
          )}
          {active === "Mapa" && (
            <MapView
              plans={visiblePlans}
              profile={profile}
              selected={selectedMapPlan}
              setSelected={setSelectedMapPlan}
              onLocate={async () => {
                if (!navigator.geolocation || !user) return toast.error("La ubicación no está disponible");
                navigator.geolocation.getCurrentPosition(
                  async (position) => {
                    const { error } = await supabase
                      .from("profiles")
                      .update({ latitude: position.coords.latitude, longitude: position.coords.longitude })
                      .eq("id", user.id);
                    if (error) return toast.error(error.message);
                    toast.success("Ubicación actualizada de forma privada");
                    await loadData(user);
                  },
                  () => toast.error("No has concedido permiso de ubicación"),
                  { enableHighAccuracy: true, timeout: 10_000 },
                );
              }}
              onManualLocation={async () => {
                const { error } = await supabase.from("profiles").update({ city: "Tarragona", latitude: 41.1189, longitude: 1.2445 }).eq("id", user.id);
                if (error) return toast.error(error.message);
                toast.success("Tarragona configurada manualmente");
                await loadData(user);
              }}
              onPlan={setSelectedPlan}
            />
          )}
          {active === "Planes" && (
            <PlansView
              plans={visiblePlans}
              profile={profile}
              members={planMembers}
              myMemberships={myMemberships}
              savedItems={savedItems}
              category={category}
              setCategory={setCategory}
              onPlan={setSelectedPlan}
              onJoin={joinPlan}
              onSave={savePlan}
              onCreate={() => setCreatePlanOpen(true)}
            />
          )}
          {active === "Grupos" && (
            <GroupsView
              communities={communities}
              members={communityMembers}
              userId={user.id}
              onCreate={() => setCreateGroupOpen(true)}
              onJoin={async (community) => {
                const existing = communityMembers.find(
                  (member) => member.community_id === community.id && member.user_id === user.id,
                );
                const operation = existing
                  ? supabase.from("community_members").delete().eq("community_id", community.id).eq("user_id", user.id)
                  : supabase.from("community_members").insert({ community_id: community.id, user_id: user.id, role: "member" });
                const { error } = await operation;
                if (error) return toast.error(error.message);
                toast.success(existing ? "Has salido del grupo" : "Solicitud registrada");
                await loadData(user);
              }}
            />
          )}
          {active === "Chat" && (
            <ChatView
              conversations={conversations}
              selected={selectedConversation}
              setSelected={setSelectedConversation}
              messages={messages}
              profiles={profiles}
              profile={profile}
              userId={user.id}
              onSend={async (content) => {
                if (!selectedConversation) return;
                const { error } = await supabase.from("messages").insert({
                  conversation_id: selectedConversation,
                  sender_id: user.id,
                  content,
                  kind: "text",
                });
                if (error) toast.error(error.message);
              }}
            />
          )}
          {active === "Calendario" && (
            <CalendarView
              plans={plans}
              myMemberships={myMemberships}
              communities={communities}
              communityMembers={communityMembers}
              onPlan={setSelectedPlan}
            />
          )}
          {active === "Perfil" && (
            <ProfileView
              profile={profile}
              trust={trust}
              plans={plans}
              connections={connections}
              myMemberships={myMemberships}
              user={user}
              onSaved={() => loadData(user)}
              go={go}
            />
          )}
          {active === "Seguridad" && (
            <Suspense fallback={<ScreenSkeleton cards={3} />}>
              <SecurityView
                user={user}
                trust={trust}
                onDeleted={async () => {
                  const { error } = await supabase.functions.invoke("delete-conecta-account");
                  if (error) return toast.error(error.message);
                  await supabase.auth.signOut();
                }}
              />
            </Suspense>
          )}
          {active === "Vida" && <Suspense fallback={<ScreenSkeleton cards={3} />}><LifeView /></Suspense>}
          {active === "Conecta+" && <Suspense fallback={<ScreenSkeleton cards={4} />}><ProductHub userId={user.id} profile={profile} profiles={profiles} plans={plans} planMembers={planMembers} messages={messages} onRefresh={() => loadData(user)} /></Suspense>}
        </div>
      </main>
      <MobileNavigation active={active} go={go} onCreate={() => setCreatePlanOpen(true)} />
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="mobile-menu-sheet">
          <SheetHeader>
            <SheetTitle>CONECTA</SheetTitle>
            <SheetDescription>Tu mundo, tu gente y tus planes.</SheetDescription>
          </SheetHeader>
          <nav className="mobile-menu-list">
            {[...primaryNavigation, { label: "Conecta+" as View, icon: Sparkles }, { label: "Perfil" as View, icon: UserCheck }, { label: "Seguridad" as View, icon: Shield }].map(
              ({ label, icon: Icon }) => (
                <button key={label} onClick={() => go(label)} className={active === label ? "active" : ""}>
                  <Icon /> {label}
                </button>
              ),
            )}
          </nav>
          <div className="mobile-demo-control">
            <button
              type="button"
              className={`demo-mode-menu-button ${demoModeEnabled ? "active" : ""}`}
              onClick={toggleDemoMode}
              aria-pressed={demoModeEnabled}
              aria-label={demoModeEnabled ? "Desactivar modo Demo" : "Activar modo Demo"}
            >
              <Sparkles />
              <span><strong>Modo Demo</strong><small>{demoModeEnabled ? "Activado · mostrando contenido de ejemplo" : "Desactivado · solo datos reales"}</small></span>
              <b>{demoModeEnabled ? "ON" : "OFF"}</b>
            </button>
          </div>
        </SheetContent>
      </Sheet>
      <CreatePlanDialog
        open={createPlanOpen}
        setOpen={setCreatePlanOpen}
        userId={user.id}
        profile={profile}
        onCreated={async (plan) => {
          setCreatePlanOpen(false);
          setActive("Planes");
          await loadData(user);
          setSelectedPlan(plan);
        }}
      />
      <CreateGroupDialog
        open={createGroupOpen}
        setOpen={setCreateGroupOpen}
        userId={user.id}
        onCreated={async () => {
          setCreateGroupOpen(false);
          await loadData(user);
        }}
      />
      <PlanDetailDialog
        plan={selectedPlan}
        setPlan={setSelectedPlan}
        profile={profile}
        members={planMembers}
        membership={myMemberships.find((item) => item.plan_id === selectedPlan?.id)}
        saved={savedItems.some((item) => item.item_type === "plan" && item.item_id === selectedPlan?.id)}
        onJoin={joinPlan}
        onSave={savePlan}
      />
    </div>
  );
}

function HomeView({
  profile,
  trust,
  plans,
  members,
  myMemberships,
  profiles,
  connections,
  savedItems,
  go,
  onCreate,
  onPlan,
  onJoin,
  onSave,
  onConnect,
  onChat,
}: {
  profile: Profile | null;
  trust: ProfileTrust | null;
  plans: Plan[];
  members: PlanMember[];
  myMemberships: PlanMember[];
  profiles: Profile[];
  connections: Connection[];
  savedItems: SavedItem[];
  go: (view: View) => void;
  onCreate: () => void;
  onPlan: (plan: Plan) => void;
  onJoin: (plan: Plan) => Promise<void>;
  onSave: (plan: Plan) => Promise<void>;
  onConnect: (profile: Profile) => Promise<void>;
  onChat: (profile: Profile) => Promise<void>;
}) {
  const firstName = profile?.display_name?.split(" ")[0] || "Fernando";
  const recommendations = [...plans].sort((a, b) => planCompatibility(b, profile) - planCompatibility(a, profile)).slice(0, 4);
  const acceptedConnections = connections.filter((item) => item.status === "accepted").length;
  const compatibilityProfiles = profiles.length ? profiles : (isDemoModeEnabled() ? demoProfiles : []);
  const discoveryCards = [
    { eyebrow: "ACTÍVATE", title: "Muévete hoy", text: "Running, paseos y rutas adaptadas a tu nivel.", image: categoryImage("Running"), icon: Footprints, target: "Explorar" as View },
    { eyebrow: "ROMPE EL HIELO", title: "Conoce gente nueva", text: "Cafés y planes tranquilos para empezar fácil.", image: categoryImage("Café"), icon: Coffee, target: "Explorar" as View },
    { eyebrow: "ENCUENTRA EQUIPO", title: "Juega a tu nivel", text: "Pádel, gimnasio y deporte con plazas reales.", image: categoryImage("Pádel"), icon: Dumbbell, target: "Planes" as View },
    { eyebrow: "HAZ CIUDAD", title: "Vive el fin de semana", text: "Música, cultura, gastronomía y planes espontáneos.", image: categoryImage("Música"), icon: Sparkles, target: "Ahora" as View },
  ];
  const actionCards = [
    { tone: "violet", icon: Compass, value: plans.length, label: "planes para explorar", text: "Filtra por actividad, distancia, nivel y ambiente.", target: "Explorar" as View },
    { tone: "coral", icon: CalendarDays, value: myMemberships.length, label: "planes en tu agenda", text: "Todo lo que confirmes aparece organizado aquí.", target: "Calendario" as View },
    { tone: "blue", icon: UsersRound, value: acceptedConnections, label: "conexiones reales", text: "Personas compatibles para compartir próximos planes.", target: "Explorar" as View },
    { tone: "green", icon: MailCheck, value: trust?.email_verified ? "OK" : "✓", label: "cuenta protegida", text: "Correo confirmado y acceso con Face ID disponible.", target: "Seguridad" as View },
  ];
  return <>
    <section className="welcome-row">
      <div><p className="eyebrow"><Sparkles /> RECOMENDACIONES DE HOY</p><h1>Hola, {firstName} <span>👋</span></h1><p>Encuentra un plan, confirma tu plaza y conoce a tu gente.</p></div>
      <div className="mini-stats"><div><strong>{connections.filter((item) => item.status === "accepted").length}</strong><span>Conexiones</span></div><div><strong>{myMemberships.length}</strong><span>Planes</span></div><div><strong>{Math.round(Number(trust?.attendance_rate ?? 100))}%</strong><span>Asistencia</span></div></div>
    </section>
    <section className="hero-card">
      <img src={`${import.meta.env.BASE_URL}media/cards/social-city.webp`} width={1280} height={853} fetchPriority="high" alt="Amigos compartiendo una experiencia" />
      <div className="hero-shade" />
      <div className="hero-copy"><span className="live-pill"><i /> {plans.length} planes activos cerca</span><h2>Tu próximo recuerdo<br /><em>empieza con un plan.</em></h2><p>Descubre actividades compatibles con tu horario, nivel y ubicación.</p><div><button className="hero-primary" onClick={() => go("Explorar")}>Explorar planes <ChevronRight /></button><button className="hero-secondary" onClick={() => go("Ahora")}><Zap /> Ver qué ocurre ahora</button></div></div>
      <button className="hero-create" onClick={onCreate}><Plus /><span><strong>Crear plan</strong><small>En menos de 1 minuto</small></span></button>
    </section>
    <section className="section-block action-section">
      <SectionTitle eyebrow="TU CONECTA DE UN VISTAZO" title="Todo listo para moverte" action="Abrir calendario" onAction={() => go("Calendario")} />
      <div className="action-card-grid">{actionCards.map(({ tone, icon: Icon, value, label, text, target }) => <button className={`action-card ${tone}`} key={label} onClick={() => go(target)}><span className="action-orb"><Icon /></span><div><strong>{value}</strong><b>{label}</b><p>{text}</p></div><ChevronRight /></button>)}</div>
    </section>
    <section className="section-block">
      <SectionTitle eyebrow="ELIGE TU MOMENTO" title="¿Qué te apetece hacer?" action="Todas las categorías" onAction={() => go("Explorar")} />
      <div className="category-row">{categories.slice(0, 12).map(({ label, icon: Icon, image }) => <button className="category" key={label} onClick={() => go("Explorar")}><img src={image} alt="" width={1280} height={853} loading="lazy" decoding="async" /><span /><b><Icon />{label}</b></button>)}</div>
    </section>
    <section className="section-block discovery-section">
      <SectionTitle eyebrow="IDEAS PARA TI" title="Empieza por lo que te apetece" action="Ver todo" onAction={() => go("Explorar")} />
      <div className="discovery-grid">{discoveryCards.map(({ eyebrow, title, text, image, icon: Icon, target }) => <button key={title} className="discovery-card" onClick={() => go(target)}><img src={image} alt="" /><span className="discovery-shade" /><span className="discovery-copy"><i><Icon /></i><small>{eyebrow}</small><strong>{title}</strong><em>{text}</em><b>Descubrir <ChevronRight /></b></span></button>)}</div>
    </section>
    <section className="section-block">
      <SectionTitle eyebrow="COMPATIBLES CONTIGO" title="Planes recomendados" action="Ver todos" onAction={() => go("Planes")} />
      {recommendations.length ? <div className="plans-grid">{recommendations.map((plan) => <PlanCard key={plan.id} plan={plan} profile={profile} members={members} membership={myMemberships.find((item) => item.plan_id === plan.id)} saved={savedItems.some((item) => item.item_type === "plan" && item.item_id === plan.id)} onOpen={onPlan} onJoin={onJoin} onSave={onSave} />)}</div> : <PlansEmpty onCreate={onCreate} />}
    </section>
    <div className="home-split">
      <section className="section-block no-margin"><SectionTitle eyebrow="PERSONAS PARA TUS PLANES" title="Compatibilidad real" action="Explorar" onAction={() => go("Explorar")} />{compatibilityProfiles.length ? <div className="people-list">{compatibilityProfiles.slice(0, 4).map((person) => <PersonRow key={person.id} person={person} current={profile} connection={connections.find((item) => item.requester_id === person.id || item.receiver_id === person.id)} onConnect={onConnect} onChat={onChat} />)}</div> : <EmptyCompact icon={<Users />} title="Tu comunidad empieza aquí" text="Cuando se registren más personas compatibles, aparecerán en esta sección." />}</section>
      <section className="section-block no-margin"><SectionTitle eyebrow="PARTICIPA SIN PLANEAR" title="Modo Ahora" action="Ver en vivo" onAction={() => go("Ahora")} /><div className="now-preview"><span><Zap /></span><div><strong>Planes espontáneos cerca de ti</strong><p>Café, paseo, running, pádel o una cena esta misma tarde.</p></div><button onClick={() => go("Ahora")}><ChevronRight /></button></div><div className="safety-preview"><ShieldCheck /><div><strong>Primeras quedadas seguras</strong><p>CONECTA exige puntos de encuentro públicos y permite compartir la quedada.</p></div></div></section>
    </div>
  </>;
}

function ExploreView({
  plans,
  profiles,
  profile,
  category,
  setCategory,
  filters,
  setFilters,
  connections,
  members,
  myMemberships,
  savedItems,
  userId,
  onPlan,
  onJoin,
  onSave,
  onConnect,
  onChat,
  onReport,
  onBlock,
}: {
  plans: Plan[];
  profiles: Profile[];
  profile: Profile | null;
  category: string;
  setCategory: (category: string) => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  connections: Connection[];
  members: PlanMember[];
  myMemberships: PlanMember[];
  savedItems: SavedItem[];
  userId: string;
  onPlan: (plan: Plan) => void;
  onJoin: (plan: Plan) => Promise<void>;
  onSave: (plan: Plan) => Promise<void>;
  onConnect: (profile: Profile) => Promise<void>;
  onChat: (profile: Profile) => Promise<void>;
  onReport: (profile: Profile) => Promise<void>;
  onBlock: (profile: Profile) => Promise<void>;
}) {
  const [exploreSort, setExploreSort] = useState<"match" | "near" | "today" | "popular" | "new">("match");
  const sortedPlans = useMemo(() => [...plans].sort((a, b) => {
    if (exploreSort === "match") return planCompatibility(b, profile) - planCompatibility(a, profile);
    if (exploreSort === "near") return (distanceKm(profile?.latitude ?? null, profile?.longitude ?? null, a.latitude, a.longitude) ?? 9999) - (distanceKm(profile?.latitude ?? null, profile?.longitude ?? null, b.latitude, b.longitude) ?? 9999);
    if (exploreSort === "today") return Number(new Date(a.starts_at ?? 0)) - Number(new Date(b.starts_at ?? 0));
    if (exploreSort === "new") return Number(new Date(b.created_at)) - Number(new Date(a.created_at));
    return 0;
  }), [exploreSort, plans, profile]);
  return <div className="view-page">
    <PageHero eyebrow="DESCUBRE TU CIUDAD" title="Planes y personas compatibles" text="Filtra por actividad, fecha, distancia, nivel, precio y ambiente." icon={<Compass />} />
    <div className="filter-layout">
      <aside className="filter-panel">
        <div><strong>Filtros</strong><button onClick={() => setFilters(initialFilters)}>Limpiar</button></div>
        <Field label="Cuándo"><select value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value as Filters["date"] })}><option value="all">Cualquier fecha</option><option value="today">Hoy</option><option value="weekend">Este fin de semana</option></select></Field>
        <Field label={`Distancia · ${filters.distance} km`}><input type="range" min="2" max="100" value={filters.distance} onChange={(event) => setFilters({ ...filters, distance: Number(event.target.value) })} /></Field>
        <Field label="Nivel"><select value={filters.level} onChange={(event) => setFilters({ ...filters, level: event.target.value })}><option value="all">Todos</option><option value="beginner">Principiante</option><option value="intermediate">Intermedio</option><option value="advanced">Avanzado</option><option value="competition">Competición</option></select></Field>
        <Field label="Precio"><select value={filters.price} onChange={(event) => setFilters({ ...filters, price: event.target.value as Filters["price"] })}><option value="all">Cualquier precio</option><option value="free">Gratis</option><option value="paid">De pago</option></select></Field>
        <label className="switch-row"><input type="checkbox" checked={filters.verified} onChange={(event) => setFilters({ ...filters, verified: event.target.checked })} /><span><strong>Solo verificados</strong><small>Perfiles con confianza</small></span></label>
      </aside>
      <section className="explore-results">
        <div className="explore-sort"><strong>Ordenar</strong><select value={exploreSort} onChange={(event) => setExploreSort(event.target.value as typeof exploreSort)}><option value="match">Para ti</option><option value="near">Cerca</option><option value="today">Hoy</option><option value="popular">Popular</option><option value="new">Nuevo</option></select></div>
        <div className="filter-pills"><button className={category === "Todos" ? "active" : ""} onClick={() => setCategory("Todos")}>Todos</button>{categories.map(({ label }) => <button key={label} className={category === label ? "active" : ""} onClick={() => setCategory(label)}>{label}</button>)}</div>
        <Tabs defaultValue="plans" className="explore-tabs">
          <TabsList><TabsTrigger value="plans">Planes ({plans.length})</TabsTrigger><TabsTrigger value="people">Personas ({profiles.length})</TabsTrigger></TabsList>
          <TabsContent value="plans"><div className="plans-grid">{sortedPlans.map((plan) => <PlanCard key={plan.id} plan={plan} profile={profile} members={members} membership={myMemberships.find((item) => item.plan_id === plan.id)} saved={savedItems.some((item) => item.item_type === "plan" && item.item_id === plan.id)} onOpen={onPlan} onJoin={onJoin} onSave={onSave} />)}</div>{!plans.length && <PlansEmpty />}</TabsContent>
          <TabsContent value="people"><div className="people-grid">{profiles.filter((person) => person.id !== userId).map((person) => <PersonCard key={person.id} person={person} current={profile} connection={connections.find((item) => item.requester_id === person.id || item.receiver_id === person.id)} onConnect={onConnect} onChat={onChat} onReport={onReport} onBlock={onBlock} />)}</div>{!profiles.length && <EmptyCompact icon={<Users />} title="Aún no hay perfiles compatibles" text="La aplicación mostrará aquí personas reales que respeten tu privacidad y filtros." />}</TabsContent>
        </Tabs>
      </section>
    </div>
  </div>;
}

function NowView({
  plans,
  profile,
  members,
  myMemberships,
  savedItems,
  onPlan,
  onJoin,
  onSave,
  onCreate,
}: {
  plans: Plan[];
  profile: Profile | null;
  members: PlanMember[];
  myMemberships: PlanMember[];
  savedItems: SavedItem[];
  onPlan: (plan: Plan) => void;
  onJoin: (plan: Plan) => Promise<void>;
  onSave: (plan: Plan) => Promise<void>;
  onCreate: () => void;
}) {
  const [nowWindow, setNowWindow] = useState<"now" | "2h" | "afternoon" | "tomorrow" | "weekend">("now");
  const filteredNowPlans = useMemo(() => {
    const now = new Date();
    return plans.filter((plan) => {
      if (!plan.starts_at) return false;
      const start = new Date(plan.starts_at);
      const hours = (start.getTime() - now.getTime()) / 3_600_000;
      if (nowWindow === "now") return plan.is_spontaneous || (hours >= 0 && hours <= 1);
      if (nowWindow === "2h") return hours >= 0 && hours <= 2;
      if (nowWindow === "afternoon") return start.toDateString() === now.toDateString() && start.getHours() >= 15;
      if (nowWindow === "tomorrow") { const d = new Date(now); d.setDate(d.getDate() + 1); return start.toDateString() === d.toDateString(); }
      return [0, 6].includes(start.getDay()) && start.getTime() >= now.getTime();
    });
  }, [nowWindow, plans]);
  return <div className="view-page">
    <section className="now-hero"><div><span className="live-pill"><i /> MODO AHORA</span><h1>¿Qué está pasando cerca?</h1><p>Planes que empiezan pronto o que desaparecerán automáticamente al terminar.</p><div><button onClick={onCreate}><Plus /> Crear plan improvisado</button><small><TimerReset /> Duración limitada y punto público obligatorio</small></div></div><div className="now-radar"><span /><span /><span /><Zap /></div></section>
    <div className="time-chips"><button className={nowWindow === "now" ? "active" : ""} onClick={() => setNowWindow("now")}>Ahora mismo</button><button className={nowWindow === "2h" ? "active" : ""} onClick={() => setNowWindow("2h")}>Próximas 2 horas</button><button className={nowWindow === "afternoon" ? "active" : ""} onClick={() => setNowWindow("afternoon")}>Esta tarde</button><button className={nowWindow === "tomorrow" ? "active" : ""} onClick={() => setNowWindow("tomorrow")}>Mañana</button><button className={nowWindow === "weekend" ? "active" : ""} onClick={() => setNowWindow("weekend")}>Fin de semana</button></div>
    <section className="section-block"><SectionTitle eyebrow="EN DIRECTO" title={`${filteredNowPlans.length} planes disponibles`} />{filteredNowPlans.length ? <div className="plans-grid">{filteredNowPlans.map((plan) => <PlanCard key={plan.id} plan={plan} profile={profile} members={members} membership={myMemberships.find((item) => item.plan_id === plan.id)} saved={savedItems.some((item) => item.item_type === "plan" && item.item_id === plan.id)} onOpen={onPlan} onJoin={onJoin} onSave={onSave} urgent />)}</div> : <EmptyFeature icon={<Zap />} title="Todavía no hay planes en directo" text="Sé la primera persona en proponer un café, un paseo, un entrenamiento o una cena para hoy." action="Crear el primero" onAction={onCreate} />}</section>
  </div>;
}

function MapView({
  plans,
  profile,
  selected,
  setSelected,
  onLocate,
  onManualLocation,
  onPlan,
}: {
  plans: Plan[];
  profile: Profile | null;
  selected: Plan | null;
  setSelected: (plan: Plan | null) => void;
  onLocate: () => Promise<void>;
  onManualLocation: () => Promise<void>;
  onPlan: (plan: Plan) => void;
}) {
  const mapped = plans.filter((plan) => plan.latitude != null && plan.longitude != null);
  return <div className="view-page map-page">
    <PageHero eyebrow="MAPA INTELIGENTE" title="Tu ciudad está llena de planes" text="Deporte, cafés, cultura, ocio y puntos recomendados para primeras quedadas." icon={<Map />} action={<div className="map-location-actions"><button onClick={() => void onLocate()}><Navigation /> Usar mi ubicación</button><button onClick={() => void onManualLocation()}><MapPin /> Tarragona manual</button></div>} />
    <div className="map-layout">
      <aside className="map-results"><div className="map-results-title"><strong>{mapped.length || plans.length} resultados</strong><small>Cerca de {profile?.city || "tu ubicación"}</small></div>{(mapped.length ? mapped : plans).map((plan) => <button key={plan.id} className={selected?.id === plan.id ? "active" : ""} onClick={() => setSelected(plan)}><span style={{ background: categoryColor(plan.category) }}><MapPin /></span><div><strong>{plan.title}</strong><small>{formatPlanDate(plan.starts_at)} · {plan.location_name}</small></div><ChevronRight /></button>)}{!plans.length && <EmptyCompact icon={<MapPin />} title="Sin planes geolocalizados" text="Los nuevos planes aparecerán en el mapa cuando incluyan ubicación." />}</aside>
      <section className="map-canvas"><iframe title="Mapa de planes CONECTA" src={mapEmbedUrl(selected)} loading="lazy" /><div className="map-legend"><span><i className="green" /> Deporte</span><span><i className="blue" /> Café</span><span><i className="orange" /> Comida</span><span><i className="purple" /> Fiesta</span><span><i className="red" /> Empieza pronto</span></div>{selected && <article className="map-plan-popover"><img src={selected.image_url || categoryImage(selected.category)} alt="" /><div><span>{selected.category}</span><strong>{selected.title}</strong><small>{selected.location_name} · {formatMoney(selected.cost_cents)}</small></div><button onClick={() => onPlan(selected)}>Ver plan</button></article>}</section>
    </div>
  </div>;
}

function PlansView({
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
}: {
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
}) {
  return <div className="view-page">
    <PageHero eyebrow="EXPERIENCIAS REALES" title="Planes que sí ocurren" text="Plazas, nivel, coste, ambiente, asistentes y seguridad antes de apuntarte." icon={<CalendarDays />} action={<button onClick={onCreate}><Plus /> Crear plan</button>} />
    <div className="plan-dashboard"><div><strong>{plans.length}</strong><span>Planes disponibles</span></div><div><strong>{myMemberships.filter((item) => ["attending", "requested", "waitlist"].includes(item.status)).length}</strong><span>Próximas asistencias</span></div><div><strong>{myMemberships.filter((item) => item.status === "waitlist").length}</strong><span>En lista de espera</span></div><div><strong>{savedItems.filter((item) => item.item_type === "plan").length}</strong><span>Guardados</span></div></div>
    <div className="filter-pills"><button className={category === "Todos" ? "active" : ""} onClick={() => setCategory("Todos")}>Todos</button>{categories.map(({ label }) => <button key={label} className={category === label ? "active" : ""} onClick={() => setCategory(label)}>{label}</button>)}</div>
    {plans.length ? <div className="plans-grid">{plans.map((plan) => <PlanCard key={plan.id} plan={plan} profile={profile} members={members} membership={myMemberships.find((item) => item.plan_id === plan.id)} saved={savedItems.some((item) => item.item_type === "plan" && item.item_id === plan.id)} onOpen={onPlan} onJoin={onJoin} onSave={onSave} />)}</div> : <PlansEmpty onCreate={onCreate} />}
  </div>;
}

function GroupsView({
  communities,
  members,
  userId,
  onCreate,
  onJoin,
}: {
  communities: Community[];
  members: CommunityMember[];
  userId: string;
  onCreate: () => void;
  onJoin: (community: Community) => Promise<void>;
}) {
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

function ChatView(props: {
  conversations: Conversation[];
  selected: string | null;
  setSelected: (id: string) => void;
  messages: Message[];
  profiles: Profile[];
  profile: Profile | null;
  userId: string;
  onSend: (content: string) => Promise<void>;
}) {
  return <Suspense fallback={<ScreenSkeleton />}><AdvancedChatView conversations={props.conversations} selected={props.selected} setSelected={props.setSelected} messages={props.messages} profiles={props.profiles} profile={props.profile} userId={props.userId} /></Suspense>;
}

function CalendarView({
  plans,
  myMemberships,
  communities,
  communityMembers,
  onPlan,
}: {
  plans: Plan[];
  myMemberships: PlanMember[];
  communities: Community[];
  communityMembers: CommunityMember[];
  onPlan: (plan: Plan) => void;
}) {
  const joined = plans.filter((plan) => myMemberships.some((member) => member.plan_id === plan.id));
  const myGroups = communities.filter((community) => communityMembers.some((member) => member.community_id === community.id));
  const currentMonth = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(new Date());
  return <div className="view-page">
    <PageHero eyebrow="TU AGENDA SOCIAL" title="Nada se queda en el aire" text="Planes confirmados, listas de espera, grupos recurrentes y recordatorios." icon={<CalendarDays />} action={<button onClick={() => exportSocialCalendar(joined, myGroups)}><Download /> Exportar agenda</button>} />
    <div className="calendar-layout">
      <section className="month-card"><header><button aria-label="Mes anterior">‹</button><strong>{currentMonth}</strong><button aria-label="Mes siguiente">›</button></header><div className="calendar-week"><b>L</b><b>M</b><b>X</b><b>J</b><b>V</b><b>S</b><b>D</b>{Array.from({ length: 35 }, (_, index) => { const day = index - 2; const events = joined.filter((plan) => plan.starts_at && new Date(plan.starts_at).getDate() === day); return <button key={index} disabled={day < 1 || day > 31} className={events.length ? "has-event" : ""}><span>{day > 0 && day <= 31 ? day : ""}</span>{events.slice(0, 2).map((plan) => <i key={plan.id} style={{ background: categoryColor(plan.category) }} />)}</button>; })}</div></section>
      <aside className="agenda-card"><header><span>PRÓXIMOS</span><strong>Tu agenda</strong></header>{joined.map((plan) => { const membership = myMemberships.find((member) => member.plan_id === plan.id); return <article key={plan.id}><div className="agenda-date"><strong>{plan.starts_at ? new Date(plan.starts_at).getDate() : "—"}</strong><span>{plan.starts_at ? new Date(plan.starts_at).toLocaleDateString("es-ES", { month: "short" }) : "Fecha"}</span></div><div><strong>{plan.title}</strong><small><MapPin />{plan.location_name || "Por confirmar"}</small><span className={`status-pill ${membership?.status}`}>{membership?.status === "attending" ? "Asistencia confirmada" : membership?.status === "waitlist" ? "Lista de espera" : membership?.status === "requested" ? "Pendiente de aprobación" : "Me interesa"}</span></div><button onClick={() => onPlan(plan)}><ChevronRight /></button></article>; })}{!joined.length && <EmptyCompact icon={<CalendarDays />} title="Tu agenda está libre" text="Cuando te apuntes a un plan, lo verás aquí y podrás añadirlo al calendario del móvil." />}</aside>
    </div>
    {myGroups.length > 0 && <section className="section-block"><SectionTitle eyebrow="ACTIVIDADES RECURRENTES" title="Calendarios de tus grupos" /><div className="recurring-row">{myGroups.map((group) => <article key={group.id}><span><RefreshCw /></span><div><strong>{group.name}</strong><small>{group.recurrence_rule || "Próxima actividad por confirmar"}</small></div></article>)}</div></section>}
  </div>;
}

function ProfileView({
  profile,
  trust,
  plans,
  connections,
  myMemberships,
  user,
  onSaved,
  go,
}: {
  profile: Profile | null;
  trust: ProfileTrust | null;
  plans: Plan[];
  connections: Connection[];
  myMemberships: PlanMember[];
  user: User;
  onSaved: () => Promise<void>;
  go: (view: View) => void;
}) {
  const [editing, setEditing] = useState(false);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const { error } = await supabase.from("profiles").update({
      display_name: String(data.get("display_name") ?? "").trim(),
      city: String(data.get("city") ?? "").trim(),
      bio: String(data.get("bio") ?? "").trim(),
      interests: String(data.get("interests") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
      profile_visibility: String(data.get("visibility") ?? "public"),
      allow_messages: String(data.get("messages") ?? "connections"),
    }).eq("id", user.id);
    if (error) return toast.error(error.message);
    setEditing(false);
    toast.success("Perfil actualizado");
    await onSaved();
  };
  const age = yearsOld(profile?.birth_date ?? null);
  const attended = myMemberships.filter((member) => member.status === "attended").length;
  const organized = plans.filter((plan) => plan.creator_id === user.id).length;
  const profileEmailVerified = Boolean(user.email_confirmed_at || trust?.email_verified);
  return <div className="view-page">
    <section className="profile-hero"><div className="profile-cover" style={{ backgroundImage: `linear-gradient(110deg,rgba(17,14,25,.15),rgba(99,102,241,.25)),url('${profile?.cover_url || `${import.meta.env.BASE_URL}media/cards/active-coast.webp`}')` }} /><div className="profile-main"><img src={profile?.avatar_url || avatarFallback} alt={profile?.display_name || "Perfil"} /><div><div className="trust-badges"><span className="pro-badge"><Sparkles /> CONECTA PRO</span><span className={profileEmailVerified ? "verified-badge" : "pending-badge"}>{profileEmailVerified ? <BadgeCheck /> : <CircleAlert />} {profileEmailVerified ? "Email verificado" : "Email pendiente"}</span><span className="biometric-badge"><Fingerprint /> Face ID disponible</span></div><h1>{profile?.display_name || "Mi perfil"}{age ? `, ${age}` : ""}</h1><p><MapPin /> {profile?.city || "Ubicación privada"} · {profile?.online ? "En línea" : "Disponible para planes"}</p></div><button onClick={() => setEditing(true)}><Settings /> Editar perfil</button></div></section>
    <div className="profile-layout"><section><div className="profile-stats"><div><strong>{connections.filter((item) => item.status === "accepted").length}</strong><span>Conexiones</span></div><div><strong>{attended}</strong><span>Quedadas</span></div><div><strong>{organized}</strong><span>Organizados</span></div><div><strong>{Math.round(Number(trust?.attendance_rate ?? 100))}%</strong><span>Asistencia</span></div></div><article className="profile-card"><span>SOBRE MÍ</span><h2>{profile?.bio || "Cuéntale a tu comunidad qué te gusta hacer."}</h2><div className="interest-pills">{profile?.interests.map((interest) => <b key={interest}>{interest}</b>)}</div></article><article className="profile-card reputation-card"><span>CONFIANZA Y REPUTACIÓN</span><div><article><UserCheck /><strong>{trust?.meetups_attended ?? 0}</strong><small>Planes asistidos</small></article><article><Clock3 /><strong>{Math.round(Number(trust?.punctuality_rate ?? 100))}%</strong><small>Puntualidad</small></article><article><Star /><strong>{trust?.organizer_tier || "Nuevo"}</strong><small>Nivel organizador</small></article></div></article><ReputationReviews userId={user.id} /></section><aside className="profile-menu"><button onClick={() => go("Calendario")}><CalendarDays /> Mi calendario <ChevronRight /></button><button onClick={() => go("Planes")}><Heart /> Planes guardados <ChevronRight /></button><button onClick={() => go("Seguridad")}><ShieldCheck /> Privacidad y seguridad <ChevronRight /></button><button onClick={() => go("Vida")}><Activity /> CONECTA Vida <ChevronRight /></button><button onClick={() => supabase.auth.signOut()}><LogOut /> Cerrar sesión <ChevronRight /></button></aside></div>
    <Dialog open={editing} onOpenChange={setEditing}><DialogContent className="form-dialog"><DialogHeader><DialogTitle>Editar perfil</DialogTitle><DialogDescription>Controla qué compartes y quién puede escribirte.</DialogDescription></DialogHeader><form className="stack-form" onSubmit={save}><div className="form-grid"><Field label="Nombre visible"><input name="display_name" defaultValue={profile?.display_name ?? ""} required /></Field><Field label="Ciudad"><input name="city" defaultValue={profile?.city ?? ""} /></Field></div><Field label="Biografía"><textarea name="bio" rows={4} defaultValue={profile?.bio ?? ""} /></Field><Field label="Intereses (separados por comas)"><input name="interests" defaultValue={profile?.interests.join(", ") ?? ""} /></Field><div className="form-grid"><Field label="Visibilidad"><select name="visibility" defaultValue={profile?.profile_visibility ?? "public"}><option value="public">Público</option><option value="connections">Solo conexiones</option><option value="private">Privado</option></select></Field><Field label="Quién puede escribir"><select name="messages" defaultValue={profile?.allow_messages ?? "connections"}><option value="everyone">Todo el mundo</option><option value="connections">Solo conexiones</option><option value="nobody">Nadie</option></select></Field></div><button className="primary-action" type="submit"><Check /> Guardar cambios</button></form></DialogContent></Dialog>
  </div>;
}

function PlanCard({
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
    <button className="plan-image" onClick={() => onOpen(plan)}><img src={plan.image_url || categoryImage(plan.category)} alt={plan.title} width={1280} height={853} loading="lazy" decoding="async" /><span className="type-pill" style={{ background: categoryColor(plan.category) }}>{plan.category || "Plan"}</span>{(urgent || plan.is_spontaneous) && <span className="urgent-pill"><Zap /> AHORA</span>}{plan.newcomer_friendly && <span className="newcomer-pill"><Sparkles /> PRIMER PLAN</span>}<div className="compatibility-ring"><strong>{planCompatibility(plan, profile)}%</strong><small>compatible</small></div></button>
    <div className="plan-body"><div className="plan-topline"><span><CalendarDays /> {formatPlanDate(plan.starts_at)}</span><button className={saved ? "saved" : ""} onClick={() => void onSave(plan)} aria-label="Guardar plan"><Heart fill={saved ? "currentColor" : "none"} /></button></div><button className="plan-title" onClick={() => onOpen(plan)}><h3>{plan.title}</h3></button><p className="plan-location"><MapPin /> {plan.location_name || "Punto por confirmar"}{distance != null && <b>· {distance.toFixed(1)} km</b>}</p><div className="plan-tags"><span>{formatLevel(plan.level)}</span><span>{formatAtmosphere(plan.atmosphere)}</span><span>{formatMoney(plan.cost_cents, plan.currency)}</span></div><div className="attendance-row"><div className="avatar-stack">{Array.from({ length: Math.min(attending, 3) }, (_, index) => <span key={index}>{String.fromCharCode(65 + index)}</span>)}</div><div><strong>{attending} personas</strong><small>{available == null ? "Sin límite" : `${available} plazas disponibles`}</small></div>{available === 1 && <em>¡Última plaza!</em>}</div><button className={`join-plan ${membership ? "joined" : ""}`} onClick={() => void onJoin(plan)}>{membership ? <Check /> : <UserRoundPlus />}{statusLabel}</button></div>
  </article>;
}

function PersonCard({
  person,
  current,
  connection,
  onConnect,
  onChat,
  onReport,
  onBlock,
}: {
  person: Profile;
  current: Profile | null;
  connection?: Connection;
  onConnect: (person: Profile) => Promise<void>;
  onChat: (person: Profile) => Promise<void>;
  onReport: (person: Profile) => Promise<void>;
  onBlock: (person: Profile) => Promise<void>;
}) {
  return <article className="person-card"><img src={person.avatar_url || avatarFallback} alt={person.display_name || "Usuario"} width={480} height={640} loading="lazy" decoding="async" /><div className="person-shade" /><span className="match"><Sparkles /> {personCompatibility(person, current)}%</span><Sheet><SheetTrigger asChild><button className="person-menu" aria-label="Seguridad"><MoreHorizontal /></button></SheetTrigger><SheetContent><SheetHeader><SheetTitle>Seguridad y control</SheetTitle><SheetDescription>Gestiona esta interacción de forma privada.</SheetDescription></SheetHeader><div className="safety-actions"><button onClick={() => void onReport(person)}><Flag /> Reportar perfil</button><button onClick={() => void onBlock(person)}><ShieldAlert /> Bloquear usuario</button></div></SheetContent></Sheet><div className="person-info"><div><h3>{person.display_name || "Usuario"}{person.show_online && person.online && <i />}</h3><span><BadgeCheck /> Perfil de la comunidad</span></div><p><MapPin /> {person.show_location ? person.city || "Ubicación privada" : "Ubicación privada"}</p><small>{person.interests.slice(0, 3).join(" · ") || "Buscando nuevos planes"}</small><div><button className={connection ? "connected" : ""} onClick={() => void onConnect(person)}>{connection ? <><Check /> {connection.status === "accepted" ? "Conectados" : "Pendiente"}</> : "Conectar"}</button><button onClick={() => void onChat(person)} aria-label="Enviar mensaje"><MessageCircle /></button></div></div></article>;
}

function PersonRow({ person, current, connection, onConnect, onChat }: { person: Profile; current: Profile | null; connection?: Connection; onConnect: (person: Profile) => Promise<void>; onChat: (person: Profile) => Promise<void> }) {
  return <article><img src={person.avatar_url || avatarFallback} alt="" /><span><strong>{person.display_name || "Usuario"}</strong><small>{person.interests.slice(0, 2).join(" · ") || person.city || "Nuevos planes"}</small></span><b>{personCompatibility(person, current)}%</b><button onClick={() => void onConnect(person)}>{connection ? <Check /> : <Plus />}</button><button onClick={() => void onChat(person)}><MessageCircle /></button></article>;
}

function PlanDetailDialog({
  plan,
  setPlan,
  profile,
  members,
  membership,
  saved,
  onJoin,
  onSave,
}: {
  plan: Plan | null;
  setPlan: (plan: Plan | null) => void;
  profile: Profile | null;
  members: PlanMember[];
  membership?: PlanMember;
  saved: boolean;
  onJoin: (plan: Plan) => Promise<void>;
  onSave: (plan: Plan) => Promise<void>;
}) {
  if (!plan) return null;
  const attending = members.filter((member) => member.plan_id === plan.id && ["attending", "attended"].includes(member.status));
  const waitlist = members.filter((member) => member.plan_id === plan.id && member.status === "waitlist").length;
  const share = async () => {
    const text = `${plan.title} · ${formatPlanDate(plan.starts_at)} · ${plan.location_name || "Punto por confirmar"}`;
    if (navigator.share) await navigator.share({ title: plan.title, text, url: window.location.href });
    else { await navigator.clipboard.writeText(text); toast.success("Información copiada"); }
  };
  return <Dialog open={Boolean(plan)} onOpenChange={(open) => !open && setPlan(null)}><DialogContent className="plan-detail-dialog"><DialogHeader className="sr-only"><DialogTitle>{plan.title}</DialogTitle><DialogDescription>Información completa y asistencia del plan.</DialogDescription></DialogHeader><div className="plan-detail-cover"><img src={plan.image_url || categoryImage(plan.category)} alt={plan.title} /><div /><span style={{ background: categoryColor(plan.category) }}>{plan.category || "Plan"}</span><b>{planCompatibility(plan, profile)}% compatible contigo</b></div><div className="plan-detail-body"><header><div><small>{formatPlanDate(plan.starts_at)}</small><h2>{plan.title}</h2><p><MapPin /> {plan.location_name || "Punto por confirmar"}</p></div><button onClick={() => void onSave(plan)} className={saved ? "saved" : ""}><Heart fill={saved ? "currentColor" : "none"} /></button><button onClick={() => void share()}><Share2 /></button></header><div className="detail-facts"><article><Users /><span><strong>{attending.length} apuntados</strong><small>{plan.max_people == null ? "Sin límite" : `${Math.max(plan.max_people - attending.length, 0)} plazas libres`}</small></span></article><article><Activity /><span><strong>{formatLevel(plan.level)}</strong><small>{formatAtmosphere(plan.atmosphere)}</small></span></article><article><Euro /><span><strong>{formatMoney(plan.cost_cents)}</strong><small>Coste estimado</small></span></article><article><ShieldCheck /><span><strong>Punto público</strong><small>Recomendado por seguridad</small></span></article></div><section className="plan-description"><span>EL PLAN</span><p>{plan.description || "El organizador compartirá los detalles en el chat del plan."}</p></section><div className="detail-columns"><section><span>QUÉ DEBES SABER</span><ul><li><Clock3 /> Duración: {plan.ends_at && plan.starts_at ? `${Math.max(1, Math.round((new Date(plan.ends_at).getTime() - new Date(plan.starts_at).getTime()) / 3_600_000))} h` : "por confirmar"}</li><li><WalletCards /> {formatMoney(plan.cost_cents)} por persona</li><li><UserCheck /> {plan.approval_mode === "manual" ? "El organizador aprueba solicitudes" : "Entrada automática si quedan plazas"}</li><li><Users /> {plan.approximate_age_min && plan.approximate_age_max ? `${plan.approximate_age_min}–${plan.approximate_age_max} años aprox.` : "Todas las edades adultas"}</li>{plan.requirements.map((requirement) => <li key={requirement}><CheckCircle2 /> {requirement}</li>)}</ul></section><section><span>PUNTO DE ENCUENTRO</span><iframe title={`Mapa de ${plan.title}`} src={mapEmbedUrl(plan)} loading="lazy" /></section></div><div className="attendance-summary"><div className="avatar-stack">{attending.slice(0, 5).map((member) => <span key={member.user_id}>{member.user_id[0].toUpperCase()}</span>)}</div><div><strong>{attending.length} personas van</strong><small>{waitlist ? `${waitlist} en lista de espera` : "Todavía hay plazas"}</small></div><div className="checkin-code"><QRCodeSVG value={`conecta://checkin/${plan.id}`} size={72} bgColor="#ffffff" fgColor="#17131f" /><span><strong>QR de asistencia</strong><small>Se activa al comenzar</small></span></div></div><div className="plan-detail-actions"><button className="secondary-action" onClick={() => { if (downloadPlanCalendar(plan)) toast.success("Añadido al calendario"); }}><Download /> Calendario</button><button className={`primary-action ${membership ? "joined" : ""}`} onClick={() => void onJoin(plan)}>{membership ? <Check /> : <UserRoundPlus />}{membership?.status === "waitlist" ? "En lista de espera" : membership?.status === "requested" ? "Solicitud enviada" : membership ? "Voy a asistir" : "Apuntarme al plan"}</button></div></div></DialogContent></Dialog>;
}

function CreatePlanDialog({
  open,
  setOpen,
  userId,
  profile,
  onCreated,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  userId: string;
  profile: Profile | null;
  onCreated: (plan: Plan) => Promise<void>;
}) {
  const [template, setTemplate] = useState(planTemplates[0]);
  const [category, setCategory] = useState("Running");
  const [busy, setBusy] = useState(false);
  const [aiIdea, setAiIdea] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const writeWithAI = async () => {
    if (aiIdea.trim().length < 8) return toast.error("Cuéntame la idea en una frase un poco más concreta.");
    setAiBusy(true);
    const { data, error } = await supabase.functions.invoke("conecta-product-ai", { body: { task: "plan_draft", input: { idea: aiIdea, city: profile?.city, interests: profile?.interests } } });
    setAiBusy(false);
    if (error) return toast.error(error.message);
    const draft = data?.result ?? {};
    const form = formRef.current;
    const setValue = (name: string, value: unknown) => { const field = form?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null; if (field && value != null) field.value = String(value); };
    setValue("title", draft.title); setValue("description", draft.description); setValue("duration", draft.duration_hours); setValue("level", draft.level); setValue("atmosphere", draft.atmosphere); setValue("requirements", Array.isArray(draft.requirements) ? draft.requirements.join(", ") : draft.requirements); setValue("indoor_backup", draft.indoor_backup);
    if (draft.category) setCategory(String(draft.category));
    const newcomer = form?.elements.namedItem("newcomer_friendly") as HTMLInputElement | null;
    if (newcomer) newcomer.checked = Boolean(draft.newcomer_friendly);
    toast.success(data?.mode === "ai" ? "La IA ha preparado el plan" : "Borrador inteligente preparado");
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const date = String(data.get("date") ?? "");
    const time = String(data.get("time") ?? "");
    const startsAt = new Date(`${date}T${time}`).toISOString();
    const duration = Number(data.get("duration") ?? 2);
    const spontaneous = data.get("spontaneous") === "on";
    const latitude = profile?.latitude ?? null;
    const longitude = profile?.longitude ?? null;
    setBusy(true);
    const { data: created, error } = await supabase.from("plans").insert({
      creator_id: userId,
      title: String(data.get("title") ?? template).trim(),
      description: String(data.get("description") ?? "").trim(),
      category,
      location_name: String(data.get("place") ?? "").trim(),
      latitude,
      longitude,
      starts_at: startsAt,
      ends_at: new Date(new Date(startsAt).getTime() + duration * 3_600_000).toISOString(),
      expires_at: spontaneous ? new Date(new Date(startsAt).getTime() + Math.max(duration, 2) * 3_600_000).toISOString() : null,
      min_people: Number(data.get("min_people") ?? 2),
      max_people: Number(data.get("max_people") ?? 8),
      level: String(data.get("level") ?? "all"),
      atmosphere: String(data.get("atmosphere") ?? "social"),
      cost_cents: Math.max(0, Math.round(Number(data.get("cost") ?? 0) * 100)),
      visibility: String(data.get("visibility") ?? "public"),
      approval_mode: String(data.get("approval") ?? "automatic"),
      approximate_age_min: Number(data.get("age_min")) || null,
      approximate_age_max: Number(data.get("age_max")) || null,
      requirements: String(data.get("requirements") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
      logistics: {
        transport: data.get("transport") === "on",
        food: data.get("food") === "on",
        reservation: data.get("reservation") === "on",
      },
      sport_details: {
        distance_km: Number(data.get("sport_distance")) || null,
        pace: String(data.get("pace") ?? "").trim() || null,
        terrain: String(data.get("terrain") ?? "").trim() || null,
        waits_for_last: data.get("waits") === "on",
        pauses: data.get("pauses") === "on",
      },
      is_spontaneous: spontaneous,
      recurrence_rule: String(data.get("recurrence") ?? "") || null,
      newcomer_friendly: data.get("newcomer_friendly") === "on",
      child_friendly: data.get("child_friendly") === "on",
      safe_space: data.get("safe_space") === "on",
      audience_mode: String(data.get("audience_mode") ?? "general"),
      indoor_backup: String(data.get("indoor_backup") ?? "").trim() || null,
      reservation_url: String(data.get("reservation_url") ?? "").trim() || null,
      transport_enabled: data.get("transport") === "on",
      meeting_safety: "public_place",
      status: "published",
    }).select("*").single();
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Plan publicado y chat creado");
    await onCreated(created as Plan);
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="create-plan-dialog"><DialogHeader><DialogTitle>Crear un plan real</DialogTitle><DialogDescription>Define la actividad, las plazas, el nivel y cómo se incorporará la gente.</DialogDescription></DialogHeader><form ref={formRef} onSubmit={submit} className="stack-form"><div className="ai-plan-writer"><Bot /><div><strong>Redactor de planes con IA</strong><small>Escribe dos frases y completa el formulario sin inventar datos personales.</small><textarea value={aiIdea} onChange={(event) => setAiIdea(event.target.value)} placeholder="Quiero quedar a correr el sábado por la mañana, ritmo tranquilo y gente nueva…" /></div><button type="button" onClick={() => void writeWithAI()} disabled={aiBusy}>{aiBusy ? <LoaderCircle className="spin" /> : <Sparkles />} Redactar</button></div><div className="template-picker"><span>EMPIEZA CON UNA PLANTILLA</span><div>{planTemplates.map((item) => <button type="button" key={item} className={template === item ? "active" : ""} onClick={() => { setTemplate(item); if (item.includes("pádel")) setCategory("Pádel"); else if (item.includes("Desayuno")) setCategory("Café"); else if (item.includes("senderismo")) setCategory("Senderismo"); else if (item.includes("idiomas")) setCategory("Idiomas"); else if (item.includes("fiesta")) setCategory("Fiesta"); else if (item.includes("corre") || item.includes("Corremos")) setCategory("Running"); }}>{item}</button>)}</div></div><Field label="Nombre del plan"><input name="title" key={template} defaultValue={template} required maxLength={80} /></Field><div className="form-grid"><Field label="Actividad"><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item.label}>{item.label}</option>)}</select></Field><Field label="Punto de encuentro público"><input name="place" required placeholder="Cafetería, parque, plaza, centro deportivo…" /></Field></div><div className="form-grid four"><Field label="Día"><input name="date" type="date" required min={new Date().toISOString().slice(0, 10)} /></Field><Field label="Hora"><input name="time" type="time" required /></Field><Field label="Duración"><select name="duration"><option value="1">1 hora</option><option value="2">2 horas</option><option value="3">3 horas</option><option value="6">6 horas</option></select></Field><Field label="Máximo"><input name="max_people" type="number" min="2" max="200" defaultValue="8" required /></Field></div><Field label="Descripción"><textarea name="description" rows={4} required maxLength={800} placeholder="Qué haréis, cómo será el ambiente y a quién va dirigido" /></Field><div className="form-grid"><Field label="Nivel"><select name="level"><option value="all">Todos</option><option value="beginner">Principiante</option><option value="intermediate">Intermedio</option><option value="advanced">Avanzado</option><option value="competition">Competición</option></select></Field><Field label="Ambiente"><select name="atmosphere"><option value="calm">Tranquilo</option><option value="social">Social</option><option value="intense">Intenso</option><option value="party">Fiesta</option></select></Field><Field label="Coste por persona (€)"><input name="cost" type="number" min="0" step="0.01" defaultValue="0" /></Field><Field label="Participantes mínimos"><input name="min_people" type="number" min="2" defaultValue="2" /></Field></div><div className="form-grid"><Field label="Visibilidad"><select name="visibility"><option value="public">Público</option><option value="connections">Solo conexiones</option><option value="private">Privado</option></select></Field><Field label="Nuevas personas"><select name="approval"><option value="automatic">Aceptar automáticamente</option><option value="manual">Aprobar solicitudes</option></select></Field><Field label="Edad mínima (opcional)"><input name="age_min" type="number" min="18" max="99" /></Field><Field label="Edad máxima (opcional)"><input name="age_max" type="number" min="18" max="99" /></Field></div><Field label="Qué deben llevar (separado por comas)"><input name="requirements" placeholder="Agua, calzado cómodo, raqueta…" /></Field>{["Running", "Senderismo", "Ciclismo", "Pádel", "Fútbol", "Gimnasio"].includes(category) && <fieldset className="sport-details"><legend>Detalles deportivos</legend><div className="form-grid"><Field label="Distancia (km)"><input name="sport_distance" type="number" min="0" step="0.1" /></Field><Field label="Ritmo o formato"><input name="pace" placeholder="5:30 min/km, dobles…" /></Field><Field label="Terreno"><input name="terrain" placeholder="Asfalto, pista, montaña…" /></Field></div><label><input type="checkbox" name="waits" defaultChecked /> Se espera a la última persona</label><label><input type="checkbox" name="pauses" /> Habrá pausas</label></fieldset>}<fieldset className="choice-field inline"><legend>Logística</legend><label><input type="checkbox" name="transport" /> Transporte</label><label><input type="checkbox" name="food" /> Comida</label><label><input type="checkbox" name="reservation" /> Reserva previa</label><label><input type="checkbox" name="spontaneous" /> Plan improvisado Ahora</label><label><input type="checkbox" name="newcomer_friendly" /> Apto para gente nueva</label><label><input type="checkbox" name="child_friendly" /> Apto con niños</label><label><input type="checkbox" name="safe_space" /> Espacio seguro reforzado</label></fieldset><div className="form-grid"><Field label="Audiencia"><select name="audience_mode"><option value="general">General</option><option value="families">Familias</option><option value="seniors">Mayores</option><option value="lgbtq">LGTBQ+ safe space</option><option value="students">Universitarios / Erasmus</option><option value="company">Empresa</option></select></Field><Field label="Plan B interior"><input name="indoor_backup" placeholder="Alternativa si llueve" /></Field><Field label="Enlace de reserva"><input name="reservation_url" type="url" placeholder="https://…" /></Field></div><Field label="Repetición (opcional)"><select name="recurrence"><option value="">No repetir</option><option value="FREQ=WEEKLY">Cada semana</option><option value="FREQ=MONTHLY">Cada mes</option></select></Field><div className="public-place-notice"><ShieldCheck /><span><strong>Seguridad activada</strong><small>Los planes públicos deben quedar en lugares públicos. El domicilio particular no está permitido.</small></span></div><button type="submit" className="primary-action" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Sparkles />} Publicar plan</button></form></DialogContent></Dialog>;
}

function CreateGroupDialog({
  open,
  setOpen,
  userId,
  onCreated,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  userId: string;
  onCreated: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    const { error } = await supabase.from("communities").insert({
      owner_id: userId,
      name: String(data.get("name") ?? "").trim(),
      description: String(data.get("description") ?? "").trim(),
      category: String(data.get("category") ?? "Nuevos en la ciudad"),
      location_name: String(data.get("location") ?? "").trim(),
      visibility: String(data.get("visibility") ?? "public"),
      member_limit: Number(data.get("limit") ?? 100),
      recurrence_rule: String(data.get("recurrence") ?? "") || null,
      rules: String(data.get("rules") ?? "Respeto y puntualidad").split("\n").map((item) => item.trim()).filter(Boolean),
      auto_approve: data.get("auto_approve") === "on",
      organizer_tier: "Organizador nuevo",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    form.reset();
    toast.success("Grupo creado con chat y calendario");
    await onCreated();
  };
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="form-dialog"><DialogHeader><DialogTitle>Crear una comunidad</DialogTitle><DialogDescription>Una actividad recurrente con miembros, chat, normas y próximos eventos.</DialogDescription></DialogHeader><form onSubmit={submit} className="stack-form"><Field label="Nombre del grupo"><input name="name" required maxLength={80} placeholder="Running de los miércoles" /></Field><Field label="Descripción"><textarea name="description" required rows={4} maxLength={600} /></Field><div className="form-grid"><Field label="Categoría"><select name="category">{categories.map((item) => <option key={item.label}>{item.label}</option>)}</select></Field><Field label="Ubicación habitual"><input name="location" required placeholder="Tarragona" /></Field></div><div className="form-grid"><Field label="Frecuencia"><select name="recurrence"><option value="FREQ=WEEKLY">Semanal</option><option value="FREQ=MONTHLY">Mensual</option><option value="">Sin frecuencia fija</option></select></Field><Field label="Límite de miembros"><input type="number" name="limit" min="2" max="5000" defaultValue="100" /></Field><Field label="Visibilidad"><select name="visibility"><option value="public">Público</option><option value="connections">Solo conexiones</option><option value="private">Privado</option></select></Field></div><Field label="Normas (una por línea)"><textarea name="rules" rows={4} defaultValue={"Respeto y buen ambiente\nPuntualidad\nNo se tolera el acoso\nLas primeras quedadas son en lugares públicos"} /></Field><label className="switch-row"><input name="auto_approve" type="checkbox" defaultChecked /><span><strong>Aprobar automáticamente</strong><small>Si se desactiva, los administradores revisan cada solicitud.</small></span></label><button type="submit" className="primary-action" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <UsersRound />} Crear comunidad</button></form></DialogContent></Dialog>;
}
