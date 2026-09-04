import { supabase } from "../supabase";

export const authRedirectUrl = () => {
  const url = new URL("./", window.location.href);
  url.search = "";
  url.hash = "";
  return url.toString();
};

export const supportsPasskeys = () =>
  typeof window !== "undefined" &&
  window.isSecureContext &&
  "PublicKeyCredential" in window;

export const friendlyAuthError = (error: unknown) => {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : String(error ?? "");
  const message = raw.toLowerCase();

  if (message.includes("invalid login credentials"))
    return "El correo o la contraseña no son correctos.";
  if (message.includes("email not confirmed"))
    return "Confirma el correo antes de iniciar sesión.";
  if (message.includes("user already registered"))
    return "Ese correo ya tiene una cuenta. Prueba a entrar.";
  if (message.includes("provider is not enabled") || message.includes("provider not enabled"))
    return "Este acceso social todavía no está activado en CONECTA. Usa tu correo mientras se configura.";
  if (message.includes("rate limit"))
    return "Has hecho varios intentos seguidos. Espera un momento y vuelve a probar.";
  if (
    message.includes("passkey") ||
    message.includes("webauthn") ||
    message.includes("credential") ||
    message.includes("notallowederror")
  )
    return "No se pudo completar el acceso biométrico. Comprueba la configuración del dispositivo y vuelve a intentarlo.";

  return raw || "No se pudo completar la operación. Inténtalo de nuevo.";
};

export const registerConectaPasskey = async () => {
  const { data, error } = await supabase.auth.registerPasskey();
  if (error) throw error;
  if (!data) throw new Error("No se pudo registrar la passkey.");
  return data.id;
};

export const signInWithConectaPasskey = async () => {
  const { data, error } = await supabase.auth.signInWithPasskey();
  if (error) throw error;
  if (!data?.session) throw new Error("La passkey no ha creado una sesión válida.");
};
