import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Archive,
  Boxes,
  CheckCircle2,
  Clock3,
  CloudUpload,
  Eye,
  FileImage,
  History,
  Image as ImageIcon,
  LockKeyhole,
  LogOut,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { supabase } from "../supabase";

type AssetStatus = "available" | "active" | "scheduled" | "archived" | "blocked";
type Tab = "Resumen" | "Biblioteca" | "Rotación" | "Programación" | "Memoria";

type Asset = {
  id: string;
  title: string;
  category: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  status: AssetStatus;
  tags: string[];
  notes: string | null;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  public_path: string | null;
  published_at: string | null;
  signedUrl?: string;
};

type Slot = {
  id: string;
  slot_key: string;
  label: string;
  section: string;
  description: string | null;
  active_asset_id: string | null;
  rotation_enabled: boolean;
  rotation_hours: number;
  updated_at: string;
};

type HistoryRow = {
  id: number;
  slot_id: string | null;
  asset_id: string | null;
  action: string;
  detail: Record<string, unknown>;
  created_at: string;
};

const tabs: Array<{ key: Tab; icon: typeof Boxes }> = [
  { key: "Resumen", icon: Boxes },
  { key: "Biblioteca", icon: ImageIcon },
  { key: "Rotación", icon: RefreshCw },
  { key: "Programación", icon: Clock3 },
  { key: "Memoria", icon: History },
];

const categoryOptions = ["general", "Inicio", "Explora", "Planes", "Eventos", "Viajes", "Perfiles", "Comunidades"];

function bytesLabel(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function dateLabel(value: string | null) {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function safeName(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function AlmacenConectaApp() {
  const [tab, setTab] = useState<Tab>("Resumen");
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("general");
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const filteredAssets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((asset) => `${asset.title} ${asset.category} ${asset.tags.join(" ")}`.toLowerCase().includes(q));
  }, [assets, query]);

  async function loadAdminState() {
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      setReady(true);
      setAuthorized(false);
      return;
    }

    const { data: member } = await supabase
      .from("conecta_admin_members")
      .select("user_id,role")
      .eq("user_id", session.user.id)
      .maybeSingle();

    setUserId(session.user.id);
    setAuthorized(Boolean(member));
    setReady(true);
    if (member) await refreshAll();
  }

  async function refreshAll() {
    setError("");
    const [assetResult, slotResult, historyResult] = await Promise.all([
      supabase.from("conecta_media_assets").select("*").order("created_at", { ascending: false }),
      supabase.from("conecta_media_slots").select("*").order("section"),
      supabase.from("conecta_media_history").select("id,slot_id,asset_id,action,detail,created_at").order("created_at", { ascending: false }).limit(100),
    ]);

    const firstError = assetResult.error || slotResult.error || historyResult.error;
    if (firstError) {
      setError(firstError.message);
      return;
    }

    const nextAssets = (assetResult.data ?? []) as Asset[];
    const paths = nextAssets.map((asset) => asset.storage_path);
    if (paths.length) {
      const { data: signed } = await supabase.storage.from("conecta-media-private").createSignedUrls(paths, 3600);
      const urlMap = new Map((signed ?? []).map((row) => [row.path, row.signedUrl]));
      for (const asset of nextAssets) asset.signedUrl = urlMap.get(asset.storage_path);
    }

    setAssets(nextAssets);
    setSlots((slotResult.data ?? []) as Slot[]);
    setHistory((historyResult.data ?? []) as HistoryRow[]);
  }

  useEffect(() => {
    void loadAdminState();
    const { data } = supabase.auth.onAuthStateChange(() => void loadAdminState());
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setAuthError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) setAuthError(loginError.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAssets([]);
    setSlots([]);
    setHistory([]);
  }

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length || !userId) return;
    setUploading(true);
    setError("");
    setNotice("");

    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 15 * 1024 * 1024) throw new Error(`${file.name}: supera el límite de 15 MB.`);
        const path = `${userId}/${Date.now()}-${crypto.randomUUID()}-${safeName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from("conecta-media-private").upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });
        if (uploadError) throw uploadError;

        const { error: rowError } = await supabase.from("conecta_media_assets").insert({
          created_by: userId,
          title: file.name.replace(/\.[^.]+$/, ""),
          category,
          storage_path: path,
          mime_type: file.type,
          file_size: file.size,
          status: "available",
        });
        if (rowError) {
          await supabase.storage.from("conecta-media-private").remove([path]);
          throw rowError;
        }
      }
      setNotice(`${files.length} archivo${files.length === 1 ? "" : "s"} añadido${files.length === 1 ? "" : "s"} al Almacén.`);
      await refreshAll();
    } catch (uploadFailure) {
      setError(uploadFailure instanceof Error ? uploadFailure.message : "No se pudo completar la subida.");
    } finally {
      setUploading(false);
    }
  }

  async function updateAsset(asset: Asset, patch: Partial<Asset>) {
    setError("");
    const { error: updateError } = await supabase.from("conecta_media_assets").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", asset.id);
    if (updateError) setError(updateError.message);
    else await refreshAll();
  }

  async function publishAsset(asset: Asset) {
    setNotice("");
    setError("");
    const { data, error: fnError } = await supabase.functions.invoke("publish-conecta-media", { body: { asset_id: asset.id } });
    if (fnError) {
      setError(fnError.message);
      return;
    }
    if (data?.error) {
      setError(data.error);
      return;
    }
    setNotice(`“${asset.title}” ya tiene copia publicada para CONECTA.`);
    await refreshAll();
  }

  async function removeAsset(asset: Asset) {
    if (!window.confirm(`¿Eliminar “${asset.title}” del Almacén?`)) return;
    setError("");
    if (asset.public_path) await supabase.storage.from("conecta-media-public").remove([asset.public_path]);
    await supabase.storage.from("conecta-media-private").remove([asset.storage_path]);
    const { error: deleteError } = await supabase.from("conecta_media_assets").delete().eq("id", asset.id);
    if (deleteError) setError(deleteError.message);
    else await refreshAll();
  }

  async function updateSlot(slot: Slot, patch: Partial<Slot>) {
    setError("");
    const { error: updateError } = await supabase.from("conecta_media_slots").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", slot.id);
    if (updateError) setError(updateError.message);
    else await refreshAll();
  }

  if (!ready) return <div className="ac-center"><div className="ac-loader" /><strong>Abriendo Almacén CONECTA…</strong></div>;

  if (!authorized) {
    return (
      <main className="ac-login-shell">
        <section className="ac-login-card">
          <div className="ac-brand-mark"><LockKeyhole size={26} /></div>
          <p className="ac-eyebrow">ÁREA PRIVADA</p>
          <h1>Almacén CONECTA</h1>
          <p className="ac-muted">Centro privado de contenido, memoria y rotación de imágenes.</p>
          <form onSubmit={signIn} className="ac-login-form">
            <label>Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
            <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
            {authError && <div className="ac-error">{authError}</div>}
            <button className="ac-primary" type="submit"><ShieldCheck size={18} /> Entrar de forma segura</button>
          </form>
          <div className="ac-security-note"><ShieldCheck size={16} /> El acceso se valida también en la base de datos. Conocer esta URL no da acceso.</div>
        </section>
      </main>
    );
  }

  const publishedCount = assets.filter((asset) => asset.public_path).length;
  const activeCount = assets.filter((asset) => asset.status === "active").length;
  const blockedCount = assets.filter((asset) => asset.status === "blocked").length;

  return (
    <div className="ac-app">
      <aside className="ac-sidebar">
        <div className="ac-logo"><div className="ac-logo-icon"><Boxes size={22} /></div><div><strong>Almacén</strong><span>CONECTA</span></div></div>
        <nav>
          {tabs.map(({ key, icon: Icon }) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><Icon size={18} />{key}</button>
          ))}
        </nav>
        <div className="ac-sidebar-bottom">
          <div className="ac-private"><ShieldCheck size={16} /><div><strong>Privado</strong><span>Solo propietario</span></div></div>
          <button className="ac-ghost" onClick={() => void signOut()}><LogOut size={17} />Cerrar sesión</button>
        </div>
      </aside>

      <main className="ac-main">
        <header className="ac-topbar">
          <div><p className="ac-eyebrow">CENTRO DE CONTROL</p><h1>{tab}</h1></div>
          <div className="ac-top-actions"><button className="ac-secondary" onClick={() => void refreshAll()}><RefreshCw size={17} />Actualizar</button><label className="ac-primary ac-upload"><Upload size={17} />Subir fotos<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={uploadFiles} disabled={uploading} /></label></div>
        </header>

        {(notice || error) && <div className={error ? "ac-banner error" : "ac-banner success"}>{error || notice}</div>}

        {tab === "Resumen" && (
          <>
            <section className="ac-hero">
              <div><span className="ac-pill"><Sparkles size={14} /> Rotación automática activa</span><h2>Tu contenido de CONECTA, bajo control.</h2><p>Los originales se guardan en privado. Solo las imágenes que publiques generan una copia para la app.</p></div>
              <div className="ac-hero-clock"><Clock3 size={26} /><strong>Cada 3 h</strong><span>rotación programada</span></div>
            </section>
            <section className="ac-stats">
              <article><FileImage size={21} /><span>Total biblioteca</span><strong>{assets.length}</strong></article>
              <article><CheckCircle2 size={21} /><span>Publicadas</span><strong>{publishedCount}</strong></article>
              <article><Play size={21} /><span>Activas</span><strong>{activeCount}</strong></article>
              <article><LockKeyhole size={21} /><span>Bloqueadas</span><strong>{blockedCount}</strong></article>
            </section>
            <section className="ac-panel"><div className="ac-panel-head"><div><p className="ac-eyebrow">DESTINOS</p><h3>Posiciones conectadas a CONECTA</h3></div></div><div className="ac-slot-grid">{slots.map((slot) => <SlotCard key={slot.id} slot={slot} assets={assets} onUpdate={updateSlot} />)}</div></section>
          </>
        )}

        {tab === "Biblioteca" && (
          <section className="ac-panel">
            <div className="ac-panel-head">
              <div><p className="ac-eyebrow">ORIGINALES PRIVADOS</p><h3>Biblioteca de imágenes</h3></div>
              <div className="ac-library-tools"><div className="ac-search"><Search size={16} /><input placeholder="Buscar foto, categoría…" value={query} onChange={(e) => setQuery(e.target.value)} /></div><select value={category} onChange={(e) => setCategory(e.target.value)}>{categoryOptions.map((option) => <option key={option}>{option}</option>)}</select></div>
            </div>
            {filteredAssets.length ? <div className="ac-media-grid">{filteredAssets.map((asset) => <AssetCard key={asset.id} asset={asset} onUpdate={updateAsset} onPublish={publishAsset} onDelete={removeAsset} />)}</div> : <EmptyLibrary uploading={uploading} onUpload={uploadFiles} />}
          </section>
        )}

        {tab === "Rotación" && (
          <section className="ac-panel"><div className="ac-panel-head"><div><p className="ac-eyebrow">AUTOMATIZACIÓN</p><h3>Rotación por destino</h3></div><span className="ac-pill"><RefreshCw size={14} /> Revisión automática cada 3 horas</span></div><div className="ac-slot-list">{slots.map((slot) => <SlotCard key={slot.id} slot={slot} assets={assets} onUpdate={updateSlot} expanded />)}</div></section>
        )}

        {tab === "Programación" && (
          <section className="ac-panel ac-empty-panel"><Clock3 size={38} /><h3>Programación avanzada preparada</h3><p>La base ya dispone de agenda por fecha, prioridad y destino. La rotación recurrente de 3 horas está activa; las campañas manuales por fecha se podrán añadir aquí sin tocar CONECTA.</p><div className="ac-chip-row"><span>Inicio</span><span>Explora</span><span>Planes</span><span>Eventos</span><span>Viajes</span></div></section>
        )}

        {tab === "Memoria" && (
          <section className="ac-panel"><div className="ac-panel-head"><div><p className="ac-eyebrow">HISTORIAL</p><h3>Memoria del Almacén</h3></div><span>{history.length} movimientos recientes</span></div><div className="ac-history">{history.length ? history.map((row) => { const asset = assets.find((item) => item.id === row.asset_id); return <article key={row.id}><div className="ac-history-icon"><History size={17} /></div><div><strong>{historyLabel(row.action)}</strong><span>{asset?.title ?? "Elemento del sistema"}</span></div><time>{dateLabel(row.created_at)}</time></article>; }) : <div className="ac-muted">Todavía no hay movimientos registrados.</div>}</div></section>
        )}
      </main>
    </div>
  );
}

function historyLabel(action: string) {
  const labels: Record<string, string> = { publish: "Publicada en CONECTA", auto_rotate: "Rotación automática", upload: "Añadida al almacén", archive: "Archivada", block: "Bloqueada" };
  return labels[action] ?? action.replaceAll("_", " ");
}

function AssetCard({ asset, onUpdate, onPublish, onDelete }: { asset: Asset; onUpdate: (asset: Asset, patch: Partial<Asset>) => Promise<void>; onPublish: (asset: Asset) => Promise<void>; onDelete: (asset: Asset) => Promise<void> }) {
  return (
    <article className="ac-media-card">
      <div className="ac-media-image">{asset.signedUrl ? <img src={asset.signedUrl} alt={asset.title} loading="lazy" /> : <ImageIcon size={34} />}<span className={`ac-status ${asset.status}`}>{asset.status}</span>{asset.public_path && <span className="ac-published"><Eye size={13} /> Publicada</span>}</div>
      <div className="ac-media-body"><div className="ac-media-title"><div><strong>{asset.title}</strong><span>{asset.category} · {bytesLabel(asset.file_size)}</span></div><span className="ac-count">{asset.usage_count} usos</span></div><div className="ac-meta">Último uso: {dateLabel(asset.last_used_at)}</div><div className="ac-card-actions"><button onClick={() => void onPublish(asset)}><CloudUpload size={16} />{asset.public_path ? "Republicar" : "Publicar"}</button><button onClick={() => void onUpdate(asset, { status: asset.status === "blocked" ? "available" : "blocked" })}><LockKeyhole size={16} />{asset.status === "blocked" ? "Desbloquear" : "Bloquear"}</button><button onClick={() => void onUpdate(asset, { status: "archived" })}><Archive size={16} />Archivar</button><button className="danger" onClick={() => void onDelete(asset)}><Trash2 size={16} /></button></div></div>
    </article>
  );
}

function SlotCard({ slot, assets, onUpdate, expanded = false }: { slot: Slot; assets: Asset[]; onUpdate: (slot: Slot, patch: Partial<Slot>) => Promise<void>; expanded?: boolean }) {
  const active = assets.find((asset) => asset.id === slot.active_asset_id);
  return (
    <article className={`ac-slot-card ${expanded ? "expanded" : ""}`}>
      <div className="ac-slot-top"><div><span>{slot.section}</span><strong>{slot.label}</strong><small>{slot.description}</small></div><label className="ac-switch"><input type="checkbox" checked={slot.rotation_enabled} onChange={(e) => void onUpdate(slot, { rotation_enabled: e.target.checked })} /><span /></label></div>
      <div className="ac-slot-current"><div className="ac-mini-thumb">{active?.signedUrl ? <img src={active.signedUrl} alt="" /> : <ImageIcon size={18} />}</div><div><span>Actual</span><strong>{active?.title ?? "Sin imagen asignada"}</strong></div></div>
      <div className="ac-slot-controls"><label>Rotación<select value={slot.rotation_hours} onChange={(e) => void onUpdate(slot, { rotation_hours: Number(e.target.value) })}><option value={1}>Cada hora</option><option value={3}>Cada 3 horas</option><option value={6}>Cada 6 horas</option><option value={12}>Cada 12 horas</option><option value={24}>Cada 24 horas</option></select></label><span>Último cambio<br /><strong>{dateLabel(slot.updated_at)}</strong></span></div>
    </article>
  );
}

function EmptyLibrary({ uploading, onUpload }: { uploading: boolean; onUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void> }) {
  return <div className="ac-empty"><div className="ac-empty-icon"><ImageIcon size={30} /></div><h3>Tu biblioteca está preparada</h3><p>Sube las primeras imágenes. Se guardarán como originales privados y no aparecerán en CONECTA hasta que pulses Publicar.</p><label className="ac-primary ac-upload"><Upload size={17} />{uploading ? "Subiendo…" : "Añadir imágenes"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={onUpload} disabled={uploading} /></label></div>;
}
