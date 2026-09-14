import { createClient } from "npm:@supabase/supabase-js@2.115.0";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
});

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Método no permitido" }, 405);

  try {
    const token=(request.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
    const authClient=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:{user},error:authError}=await authClient.auth.getUser(token);
    if(authError||!user)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers:{...cors,"Content-Type":"application/json"}});

    const body = await request.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim().slice(0, 8000) : "";
    const image = typeof body?.image_data_url === "string" ? body.image_data_url : "";
    if (!text && !image) return json({ error: "Falta contenido" }, 400);
    if (image && image.length > 9_000_000) return json({ error: "Imagen demasiado grande para moderación" }, 413);

    const key = Deno.env.get("OPENAI_API_KEY") ?? "";
    if (!key) return json({ flagged: false, unavailable: true, categories: {}, message: "Moderación IA no configurada" });

    const input: Array<Record<string, unknown>> = [];
    if (text) input.push({ type: "text", text });
    if (image) input.push({ type: "image_url", image_url: { url: image } });

    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "omni-moderation-latest", input }),
    });
    const data = await response.json();
    if (!response.ok) return json({ flagged: false, unavailable: true, categories: {}, provider_error: data?.error?.message ?? "Moderación no disponible" });

    const result = data?.results?.[0] ?? {};
    return json({
      flagged: Boolean(result.flagged),
      categories: result.categories ?? {},
      category_scores: result.category_scores ?? {},
      model: data?.model ?? "omni-moderation-latest",
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
