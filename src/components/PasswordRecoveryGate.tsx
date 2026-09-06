import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { supabase } from "../supabase";

type Props = { children: ReactNode };

export function PasswordRecoveryGate({ children }: Props) {
  const [recovering, setRecovering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirm_password") ?? "");

    setMessage("");
    if (password.length < 8) {
      setMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    setMessage("Contraseña actualizada. Ya puedes iniciar sesión con la nueva contraseña.");
    await supabase.auth.signOut();
    setBusy(false);
    window.setTimeout(() => window.location.replace(import.meta.env.BASE_URL), 700);
  };

  if (!recovering) return children;

  return (
    <main className="centered-flow">
      <div className="flow-card">
        <span className="flow-icon"><LockKeyhole /></span>
        <span className="eyebrow">RECUPERACIÓN SEGURA</span>
        <h1>Crea una nueva contraseña</h1>
        <p>El enlace de recuperación se ha validado. Elige ahora una contraseña nueva para tu cuenta de CONECTA.</p>
        <div className="email-delivery-status">
          <ShieldCheck />
          <span><strong>Sesión de recuperación activa</strong><small>La sesión se cerrará al terminar para que vuelvas a entrar con la contraseña nueva.</small></span>
        </div>
        <form className="stack-form" onSubmit={submit}>
          <label className="auth2-field">
            <span>Nueva contraseña</span>
            <input name="password" type="password" minLength={8} autoComplete="new-password" required />
          </label>
          <label className="auth2-field">
            <span>Repite la contraseña</span>
            <input name="confirm_password" type="password" minLength={8} autoComplete="new-password" required />
          </label>
          {message && <p role="status">{message}</p>}
          <button type="submit" className="primary-action" disabled={busy}>
            {busy ? <LoaderCircle className="spin" /> : <LockKeyhole />} Guardar nueva contraseña
          </button>
        </form>
      </div>
    </main>
  );
}
