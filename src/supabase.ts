import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://qdjuypoqiafqncwgmicf.supabase.co";

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_cJAhkB9oDjK-ecmrEshNvA_79F3_G55";

const client = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    experimental: { passkey: true },
    persistSession: true,
  },
  realtime: { params: { eventsPerSecond: 10 } },
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
