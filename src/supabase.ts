import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Configúralas en el entorno de CONECTA.");
}

const client = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    experimental: { passkey: true },
    persistSession: true,
  },
  realtime: { params: { eventsPerSecond: 10 } },
});

const fallbackPasskeyError = new Error("passkey disabled: use CONECTA WebAuthn fallback");
if (client.auth.passkey) {
  Object.defineProperty(client.auth.passkey, "list", {
    configurable: true,
    value: async () => ({ data: [], error: fallbackPasskeyError }),
  });
}
Object.defineProperty(client.auth, "registerPasskey", {
  configurable: true,
  value: async () => ({ data: null, error: fallbackPasskeyError }),
});
Object.defineProperty(client.auth, "signInWithPasskey", {
  configurable: true,
  value: async () => ({ data: null, error: fallbackPasskeyError }),
});

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    void client.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: verified, error } = await client.auth.getUser();
      if (error || !verified.user) await client.auth.signOut({ scope: "local" });
    });
  });
}

export const supabase = client;
