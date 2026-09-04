import { type FormEvent, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Bell, Check, ChevronRight, CircleAlert, Fingerprint, LoaderCircle, LockKeyhole, LogOut, MailCheck, MapPin, RefreshCw, ShieldCheck, Sparkles, UserRoundPlus, Users } from "lucide-react";
import { Toaster, toast } from "../ui";
import { supabase } from "../supabase";
import { authRedirectUrl, friendlyAuthError, signInWithConectaPasskey, supportsPasskeys } from "../auth/passkeys";
import { categories } from "../catalog";
import { Field } from "../components/common";
import type { Profile } from "../types";
import "../auth-premium-final.css";

type AuthMode = "signin" | "signup";
export function LoadingScreen({ label }: { label: string }) { return <main className="loading-screen"><span className="brand-mark large">C</span><LoaderCircle className="spin" /><strong>{label}</strong></main>; }

export function AuthScreen({ mode, pendingEmail, setMode, setPendingEmail }: { mode: AuthMode; pendingEmail: string; setMode: (mode: AuthMode) => void; setPendingEmail: (email: string) => void; }) {
  const [busy, setBusy] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const displayName = String(data.get("display_name") ?? "").trim();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "signup") {
        const { data: result, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName }, emailRedirectTo: authRedirectUrl() } });
        if (error) return setMessage(friendlyAuthError(error));
        if (!result.session) {
          setPendingEmail(email);
          setMessage("Correo enviado. Abre el enlace de verificación para continuar.");
        }
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(friendlyAuthError(error));
    } catch (error) {
      setMessage(friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const signInWithPasskey = async () => {
    if (!supportsPasskeys()) {
      setMessage("Este dispositivo o navegador no admite Face ID para la web. Prueba con Safari actualizado.");
      return;
    }
    setPasskeyBusy(true);
    setMessage("");
    try { await signInWithConectaPasskey(); }
    catch (error) { setMessage(friendlyAuthError(error)); }
    finally { setPasskeyBusy(false); }
  };

  const resetPassword = async () => {
    const email = window.prompt("Introduce tu correo para recuperar la contraseña:");
    if (!email?.trim()) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: authRedirectUrl() });
    if (error) return toast.error(friendlyAuthError(error));
    toast.success("Revisa tu correo para cambiar la contraseña");
  };

  const resend = async () => {
    if (!pendingEmail) return;
    const { error } = await supabase.auth.resend({ type: "signup", email: pendingEmail, options: { emailRedirectTo: authRedirectUrl() } });
    if (error) return toast.error(friendlyAuthError(error));
    toast.success("Correo reenviado");
  };

  return <main className={`auth2-screen auth2-${mode}`}>
    <Toaster position="top-center" richColors />
    <section className="auth2-visual" aria-label="CONECTA, planes reales con gente compatible">
      <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=90" alt="Grupo de amigos compartiendo un plan" />
      <div className="auth2-visual-brand"><span className="auth2-logo">C</span><strong>CONECTA</strong></div>
      <div className="auth2-visual-copy">
        <span className="auth2-eyebrow"><Sparkles /> ACTIVIDADES REALES, CONEXIONES REALES</span>
        <h1>Gente real.<br /><em>Planes de verdad.</em></h1>
        <p>Descubre, conecta y vive más. Encuentra personas y planes cerca de ti con más seguridad.</p>
        <div className="auth2-proof"><span><ShieldCheck /> Quedadas seguras</span><span><MapPin /> Cerca de ti</span><span><Users /> Gente compatible</span></div>
      </div>
    </section>

    <section className="auth2-panel">
      <div className="auth2-card">
        <div className="auth2-mobile-brand"><span className="auth2-logo">C</span><div><strong>CONECTA</strong><small>PLANES · PERSONAS · EXPERIENCIAS</small></div></div>
        <span className="auth2-kicker">{mode === "signin" ? "BIENVENIDO DE NUEVO" : "EMPIEZA EN CONECTA"}</span>
        <h2>{mode === "signin" ? "Entra en CONECTA" : "Crea tu cuenta"}</h2>
        <p className="auth2-subtitle">{mode === "signin" ? "Continúa donde lo dejaste y descubre qué está pasando cerca de ti." : "Únete a una comunidad de personas que, como tú, quieren hacer planes."}</p>

        <div className="auth2-switch">
          <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Entrar</button>
          <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Registrarme</button>
        </div>

        <form className="auth2-form" onSubmit={submit}>
          {mode === "signup" && <div className="auth2-field"><label htmlFor="auth-display-name">Nombre visible</label><input id="auth-display-name" name="display_name" required maxLength={50} autoComplete="name" placeholder="Cómo quieres que te llamen" /></div>}
          <div className="auth2-field"><label htmlFor="auth-email">Correo electrónico</label><input id="auth-email" name="email" type="email" required autoComplete="email" placeholder="tu@correo.com" /></div>
          <div className="auth2-field"><label htmlFor="auth-password">Contraseña</label><input id="auth-password" name="password" type="password" minLength={8} required autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="Mínimo 8 caracteres" /></div>
          {message && <div className="auth2-message"><CircleAlert /> <span>{message}</span></div>}
          <button className="auth2-primary" disabled={busy} type="submit">{busy ? <LoaderCircle className="spin" /> : mode === "signin" ? <LockKeyhole /> : <UserRoundPlus />}{busy ? "Procesando…" : mode === "signin" ? "Entrar de forma segura" : "Crear mi cuenta"}</button>
        </form>

        {mode === "signin" && <>
          <div className="auth2-divider"><span>o continúa con</span></div>
          <button className="auth2-passkey" onClick={() => void signInWithPasskey()} disabled={passkeyBusy}>{passkeyBusy ? <LoaderCircle className="spin" /> : <Fingerprint />}<span><strong>Face ID</strong><small>Accede con tu iPhone de forma rápida y protegida</small></span><ChevronRight /></button>
        </>}

        <div className="auth2-links">
          {pendingEmail && <button className="auth2-text-button" onClick={resend}><RefreshCw /> Reenviar verificación</button>}
          {mode === "signin" && <button className="auth2-text-button" onClick={resetPassword}>¿Has olvidado tu contraseña?</button>}
        </div>
        <small className="auth2-legal">Al continuar aceptas las <b>Normas de convivencia</b>, la <b>Política de privacidad</b> y las <b>Condiciones</b> de CONECTA.</small>
        <div className="auth2-security-note"><ShieldCheck /> Tus credenciales se gestionan de forma segura.</div>
      </div>
    </section>
  </main>;
}

export function EmailVerificationScreen({ user }: { user: User }) { const [busy, setBusy] = useState(false); const resend = async () => { if (!user.email) return; setBusy(true); const { error } = await supabase.auth.resend({ type: "signup", email: user.email, options: { emailRedirectTo: authRedirectUrl() } }); setBusy(false); if (error) return toast.error(friendlyAuthError(error)); toast.success("Correo reenviado"); }; return <main className="centered-flow"><Toaster position="top-center" richColors /><div className="flow-card"><span className="flow-icon"><Bell /></span><span className="eyebrow">PRIMER PASO DE SEGURIDAD</span><h1>Confirma tu correo</h1><p>Abre el enlace que hemos enviado a <strong>{user.email}</strong>. El enlace vuelve directamente a CONECTA y desbloquea tu perfil.</p><div className="email-delivery-status"><MailCheck /><span><strong>Enlace seguro y de un solo uso</strong><small>Revisa también Spam o Correo no deseado.</small></span></div><button className="primary-action" onClick={resend} disabled={busy}><RefreshCw className={busy ? "spin" : ""} /> Reenviar correo</button><button className="text-action" onClick={() => supabase.auth.signOut()}><LogOut /> Usar otra cuenta</button></div></main>; }

export function OnboardingScreen({ user, profile, onComplete }: { user: User; profile: Profile | null; onComplete: () => Promise<void>; }) {
  const [step, setStep] = useState(1); const [busy, setBusy] = useState(false); const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); setBusy(true); const { error } = await supabase.from("profiles").upsert({ id: user.id, display_name: String(data.get("display_name") ?? profile?.display_name ?? "").trim(), city: String(data.get("city") ?? "").trim(), bio: String(data.get("bio") ?? "").trim(), birth_date: String(data.get("birth_date") ?? "") || null, interests, languages: String(data.get("languages") ?? "Español").split(",").map((item) => item.trim()).filter(Boolean), social_goals: data.getAll("goals").map(String), preferred_group_size: String(data.get("group_size") ?? "any"), preferred_atmospheres: data.getAll("atmospheres").map(String), max_distance_km: Number(data.get("distance") ?? 25), budget_max_cents: Math.max(0, Number(data.get("budget") ?? 50) * 100), onboarding_completed: true }); setBusy(false); if (error) return toast.error(error.message); toast.success("Tu perfil está preparado"); await onComplete(); };
  return <main className="onboarding-screen"><Toaster position="top-center" richColors /><header><span className="brand-mark">C</span><strong>CONECTA</strong><div><i style={{ width: `${step * 33.33}%` }} /></div><small>Paso {step} de 3</small></header><form onSubmit={submit} className="onboarding-card">{step === 1 && <><span className="eyebrow">TU PERFIL SOCIAL</span><h1>Empecemos por ti</h1><p>Solo mostraremos los datos que tú decidas compartir.</p><div className="form-grid"><Field label="Nombre visible"><input name="display_name" defaultValue={profile?.display_name ?? user.user_metadata.display_name ?? ""} required maxLength={50} /></Field><Field label="Ciudad"><input name="city" defaultValue={profile?.city ?? "Tarragona"} required /></Field></div><Field label="Fecha de nacimiento"><input name="birth_date" type="date" defaultValue={profile?.birth_date ?? ""} /></Field><Field label="Cuéntanos algo de ti"><textarea name="bio" defaultValue={profile?.bio ?? ""} maxLength={300} rows={4} placeholder="Qué planes te gustan y qué gente quieres conocer" /></Field><button type="button" className="primary-action" onClick={() => setStep(2)}>Continuar <ChevronRight /></button></>}{step === 2 && <><span className="eyebrow">COMPATIBILIDAD REAL</span><h1>¿Qué te apetece hacer?</h1><p>Elige al menos tres intereses. Se usarán para recomendarte personas y planes.</p><div className="onboarding-interests">{categories.map(({ label, icon: Icon }) => <button type="button" key={label} className={interests.includes(label) ? "active" : ""} onClick={() => setInterests((items) => items.includes(label) ? items.filter((item) => item !== label) : [...items, label])}><Icon /> {label}<Check /></button>)}</div><div className="step-actions"><button type="button" className="secondary-action" onClick={() => setStep(1)}>Atrás</button><button type="button" className="primary-action" disabled={interests.length < 3} onClick={() => setStep(3)}>Continuar <ChevronRight /></button></div></>}{step === 3 && <><span className="eyebrow">TU FORMA DE CONECTAR</span><h1>Ajusta tus recomendaciones</h1><p>Podrás cambiarlo después desde tu perfil.</p><Field label="Idiomas (separados por comas)"><input name="languages" defaultValue={(profile?.languages ?? ["Español"]).join(", ")} /></Field><fieldset className="choice-field"><legend>Busco principalmente</legend><label><input type="checkbox" name="goals" value="amistad" defaultChecked /> Amistad</label><label><input type="checkbox" name="goals" value="deporte" /> Deporte</label><label><input type="checkbox" name="goals" value="networking" /> Networking</label><label><input type="checkbox" name="goals" value="compañía" /> Compañía</label></fieldset><fieldset className="choice-field"><legend>Ambiente preferido</legend><label><input type="checkbox" name="atmospheres" value="calm" defaultChecked /> Tranquilo</label><label><input type="checkbox" name="atmospheres" value="social" defaultChecked /> Social</label><label><input type="checkbox" name="atmospheres" value="intense" /> Intenso</label><label><input type="checkbox" name="atmospheres" value="party" /> Fiesta</label></fieldset><div className="form-grid"><Field label="Tamaño de grupo"><select name="group_size" defaultValue="any"><option value="small">Pequeño</option><option value="medium">Mediano</option><option value="large">Grande</option><option value="any">Me da igual</option></select></Field><Field label="Distancia máxima"><select name="distance" defaultValue="25"><option value="5">5 km</option><option value="15">15 km</option><option value="25">25 km</option><option value="50">50 km</option></select></Field></div><Field label="Presupuesto máximo habitual (€)"><input type="number" min="0" max="1000" name="budget" defaultValue="50" /></Field><div className="step-actions"><button type="button" className="secondary-action" onClick={() => setStep(2)}>Atrás</button><button type="submit" className="primary-action" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Sparkles />} Entrar en CONECTA</button></div></>}</form></main>;
}