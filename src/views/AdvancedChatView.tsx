import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, Edit3, ImagePlus, MapPin, MessageCircle, Mic, Reply, Search, Send, X } from "lucide-react";
import { supabase } from "../supabase";
import type { Conversation, Message, Profile } from "../types";
import { EmptyCompact, EmptyFeature, PageHero } from "../components/common";
import { toast } from "../toast";

type Props = { conversations: Conversation[]; selected: string | null; setSelected: (id: string) => void; messages: Message[]; profiles: Profile[]; profile: Profile | null; userId: string; onRefresh?: () => Promise<void>; };
type RichMessage = Message & { media_url?: string | null; reply_to?: string | null; edited_at?: string | null; kind?: string };
type ConversationFilter = "all" | "people" | "plans" | "groups";

const conversationFallback = `${import.meta.env.BASE_URL}media/cards/social-city.webp`;
const groupConversationFallback = `${import.meta.env.BASE_URL}media/cards/creative-community.webp`;

export function AdvancedChatView({ conversations, selected, setSelected, messages, profiles, profile, userId, onRefresh }: Props) {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [replying, setReplying] = useState<RichMessage | null>(null);
  const [editing, setEditing] = useState<RichMessage | null>(null);
  const [signedMedia, setSignedMedia] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);

  const activeConversation = conversations.find((conversation) => conversation.id === selected);
  const activeMessages = useMemo(() => (messages as RichMessage[]).filter((message) => !selected || message.conversation_id === selected), [messages, selected]);

  const conversationPerson = (conversation: Conversation) => {
    if (conversation.type === "group") return null;
    const creator = conversation.created_by !== userId ? profiles.find((person) => person.id === conversation.created_by) : null;
    const title = (conversation.title || "").toLowerCase();
    return creator || profiles.find((person) => person.id !== userId && person.display_name && title.includes(person.display_name.toLowerCase())) || null;
  };

  const conversationPhoto = (conversation: Conversation) => {
    if (conversation.type === "group") return groupConversationFallback;
    return conversationPerson(conversation)?.avatar_url || profiles.find((person) => person.id !== userId && person.avatar_url)?.avatar_url || conversationFallback;
  };

  const conversationKind = (conversation: Conversation) => conversation.plan_id ? "Plan" : conversation.community_id ? "Grupo" : "Persona";
  const conversationDescription = (conversation: Conversation) => {
    if (conversation.plan_id) return "Chat del plan · organiza hora, lugar y detalles";
    if (conversation.community_id) return "Comunidad · conversación de grupo";
    const person = conversationPerson(conversation);
    if (person?.online) return "En línea ahora";
    if (person?.city) return `Conexión · ${person.city}`;
    return "Conexión privada";
  };

  const visibleConversations = useMemo(() => conversations.filter((conversation) => {
    const title = conversation.title || "Conversación privada";
    if (search && !`${title} ${conversationDescription(conversation)}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "people") return !conversation.plan_id && !conversation.community_id;
    if (filter === "plans") return Boolean(conversation.plan_id);
    if (filter === "groups") return Boolean(conversation.community_id || conversation.type === "group");
    return true;
  }), [conversations, filter, search]);

  const recentConversations = visibleConversations.slice(0, 8);

  useEffect(() => {
    let cancelled = false;
    const loadSigned = async () => {
      const missing = activeMessages.filter((message) => message.media_url && !String(message.media_url).startsWith("geo:") && !signedMedia[message.id]);
      if (!missing.length) return;
      const next: Record<string, string> = {};
      await Promise.all(missing.map(async (message) => {
        const { data } = await supabase.storage.from("chat-media").createSignedUrl(String(message.media_url), 3600);
        if (data?.signedUrl) next[message.id] = data.signedUrl;
      }));
      if (!cancelled && Object.keys(next).length) setSignedMedia((current) => ({ ...current, ...next }));
    };
    void loadSigned();
    return () => { cancelled = true; };
  }, [activeMessages, signedMedia]);

  const sendText = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const content = draft.trim();
    if (!content) return;
    setBusy(true);
    if (editing) {
      const { error } = await supabase.from("messages").update({ content, edited_at: new Date().toISOString() }).eq("id", editing.id).eq("sender_id", userId);
      setBusy(false);
      if (error) return toast.error(error.message);
      setEditing(null);
      setDraft("");
      toast.success("Mensaje editado");
      await onRefresh?.();
      return;
    }
    const { error } = await supabase.from("messages").insert({ conversation_id: selected, sender_id: userId, content, kind: "text", reply_to: replying?.id ?? null });
    setBusy(false);
    if (error) return toast.error(error.message);
    setDraft("");
    setReplying(null);
    await onRefresh?.();
  };

  const uploadMedia = async (file?: File) => {
    if (!file || !selected) return;
    if (file.size > 12 * 1024 * 1024) return toast.error("El archivo supera 12 MB");
    setBusy(true);
    const safe = file.name.replace(/[^a-z0-9._-]+/gi, "-");
    const path = `${selected}/${userId}/${crypto.randomUUID()}-${safe}`;
    const upload = await supabase.storage.from("chat-media").upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) { setBusy(false); return toast.error(upload.error.message); }
    const kind = file.type.startsWith("audio/") ? "audio" : "image";
    const created = await supabase.from("messages").insert({ conversation_id: selected, sender_id: userId, content: kind === "audio" ? "Nota de voz" : "Imagen", kind, media_url: path, reply_to: replying?.id ?? null });
    if (created.error) { await supabase.storage.from("chat-media").remove([path]); setBusy(false); return toast.error(created.error.message); }
    setBusy(false);
    setReplying(null);
    await onRefresh?.();
  };

  const shareLocation = () => {
    if (!selected || !navigator.geolocation) return toast.error("Ubicación no disponible");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const value = `geo:${position.coords.latitude},${position.coords.longitude}`;
      const { error } = await supabase.from("messages").insert({ conversation_id: selected, sender_id: userId, content: "Ubicación compartida", kind: "location", media_url: value, reply_to: replying?.id ?? null });
      setBusy(false);
      if (error) return toast.error(error.message);
      setReplying(null);
      await onRefresh?.();
    }, (error) => { setBusy(false); toast.error(error.message); }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const startEdit = (message: RichMessage) => { setEditing(message); setReplying(null); setDraft(message.content || ""); };
  const cancelComposeMode = () => { setEditing(null); setReplying(null); setDraft(""); };
  const replyPreview = (message: RichMessage) => activeMessages.find((item) => item.id === message.reply_to);

  return <div className="view-page chat-page advanced-chat">
    <PageHero eyebrow="MENSAJES CONECTA" title="Tus conversaciones, más claras y más vivas" text="Una experiencia rápida y visual para hablar con personas, planes y grupos sin perder el contexto." icon={<MessageCircle />} />

    <section className="chat-social-strip" aria-label="Conversaciones recientes">
      <div className="chat-social-heading"><div><span>RECIENTES</span><strong>Personas y planes activos</strong></div><small>{conversations.length} conversaciones</small></div>
      <div className="chat-social-row">
        {recentConversations.map((conversation) => <button key={conversation.id} className={selected === conversation.id ? "active" : ""} onClick={() => setSelected(conversation.id)}>
          <span className="story-ring"><img src={conversationPhoto(conversation)} alt="" loading="lazy" decoding="async" /></span>
          <strong>{conversation.title || "Conversación"}</strong>
          <small>{conversationKind(conversation)}</small>
        </button>)}
        {!recentConversations.length && <EmptyCompact icon={<MessageCircle />} title="Sin conversaciones recientes" text="Tus chats aparecerán aquí." />}
      </div>
    </section>

    <div className="chat-filter-bar">
      <div className="chat-search"><Search /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar mensajes o personas…" /></div>
      <div className="chat-filter-pills">
        {([["all","Todos"],["people","Personas"],["plans","Planes"],["groups","Grupos"]] as const).map(([value,label]) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>)}
      </div>
    </div>

    <div className="chat-layout">
      <aside className="conversation-panel">
        <div className="conversation-list-heading"><strong>Mensajes</strong><small>{visibleConversations.length} visibles</small></div>
        {visibleConversations.map((conversation) => <button key={conversation.id} className={selected === conversation.id ? "active" : ""} onClick={() => setSelected(conversation.id)}>
          <span className="conversation-avatar photo"><img src={conversationPhoto(conversation)} alt="" loading="lazy" decoding="async" /></span>
          <span className="conversation-copy"><strong>{conversation.title || "Conversación privada"}</strong><small>{conversationDescription(conversation)}</small><em>{conversationKind(conversation)}</em></span>
          <ChevronRight />
        </button>)}
        {!visibleConversations.length && <EmptyCompact icon={<MessageCircle />} title="No hay resultados" text="Prueba otro filtro o búsqueda." />}
      </aside>

      <section className="message-panel">
        {activeConversation ? <>
          <header>
            <span className="conversation-avatar photo"><img src={conversationPhoto(activeConversation)} alt="" decoding="async" /></span>
            <div><strong>{activeConversation.title || "Conversación"}</strong><small><i /> {conversationDescription(activeConversation)}</small></div>
            <span className="conversation-header-badge">{conversationKind(activeConversation)}</span>
          </header>
          <div className="messages">
            <div className="day-marker">CONVERSACIÓN SEGURA</div>
            {activeMessages.map((message) => {
              const sender = message.sender_id === userId ? profile : profiles.find((person) => person.id === message.sender_id);
              const replied = replyPreview(message);
              const geo = message.media_url?.startsWith("geo:") ? message.media_url.slice(4).split(",") : null;
              return <div key={message.id} className={message.sender_id === userId ? "message mine rich-message" : "message rich-message"}>
                <small className="message-sender">{sender?.display_name || "Usuario"}</small>
                {replied && <div className="reply-preview"><Reply /><span>{replied.content || replied.kind}</span></div>}
                <div className="message-content">{message.content}</div>
                {message.kind === "image" && signedMedia[message.id] && <img className="chat-media-image" src={signedMedia[message.id]} alt="Imagen compartida" />}
                {message.kind === "audio" && signedMedia[message.id] && <audio className="chat-media-audio" controls src={signedMedia[message.id]} />}
                {message.kind === "location" && geo && <a className="chat-location" href={`https://www.openstreetmap.org/?mlat=${encodeURIComponent(geo[0])}&mlon=${encodeURIComponent(geo[1])}#map=16/${encodeURIComponent(geo[0])}/${encodeURIComponent(geo[1])}`} target="_blank" rel="noreferrer"><MapPin /> Abrir ubicación</a>}
                <footer><time>{new Date(message.created_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}{message.edited_at ? " · editado" : ""}</time><span><button type="button" aria-label="Responder" onClick={() => setReplying(message)}><Reply /></button>{message.sender_id === userId && message.kind === "text" && <button type="button" aria-label="Editar mensaje" onClick={() => startEdit(message)}><Edit3 /></button>}</span></footer>
              </div>;
            })}
            {!activeMessages.length && <div className="conversation-empty"><MessageCircle /><strong>Empieza la conversación</strong><p>Pregunta por el plan, comparte una foto, manda una nota de voz o envía tu ubicación cuando sea necesario.</p></div>}
          </div>
          {(replying || editing) && <div className="compose-context"><span>{editing ? <Edit3 /> : <Reply />}<b>{editing ? "Editando" : "Respondiendo"}</b><small>{editing?.content || replying?.content}</small></span><button type="button" aria-label="Cancelar" onClick={cancelComposeMode}><X /></button></div>}
          <div className="quick-replies">{["¿Nos vemos en la entrada?", "¿Hace falta llevar material?", "Llego diez minutos tarde", "Perfecto, allí nos vemos 🙌"].map((text) => <button type="button" key={text} onClick={() => setDraft(text)}>{text}</button>)}</div>
          <form className="message-form" onSubmit={sendText}>
            <button type="button" aria-label="Adjuntar imagen" onClick={() => fileRef.current?.click()}><ImagePlus /></button>
            <button type="button" aria-label="Adjuntar audio" onClick={() => audioRef.current?.click()}><Mic /></button>
            <button type="button" aria-label="Compartir ubicación" onClick={shareLocation}><MapPin /></button>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={editing ? "Edita tu mensaje…" : "Mensaje…"} maxLength={1500} />
            <button type="submit" aria-label={editing ? "Guardar mensaje" : "Enviar mensaje"} disabled={busy}>{editing ? <Check /> : <Send />}</button>
            <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void uploadMedia(e.target.files?.[0])} />
            <input ref={audioRef} hidden type="file" accept="audio/webm,audio/mp4,audio/mpeg" onChange={(e) => void uploadMedia(e.target.files?.[0])} />
          </form>
        </> : <EmptyFeature icon={<MessageCircle />} title="Selecciona una conversación" text="Aquí se muestran los mensajes privados y los chats de planes y comunidades." />}
      </section>
    </div>
  </div>;
}
