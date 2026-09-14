import { createClient } from "npm:@supabase/supabase-js@2.115.0";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
});

const taskInstructions: Record<string, string> = {
  plan_draft: "Convierte la idea en un plan social seguro. Devuelve title, description, category, level, atmosphere, duration_hours, requirements, indoor_backup y newcomer_friendly.",
  orphan_matches: "Ordena candidatos compatibles para un plan con pocas inscripciones. Devuelve matches con user_id, score y reason. No uses atributos sensibles.",
  chat_summary: "Resume únicamente decisiones, horarios, lugares, preguntas pendientes y mensajes importantes. Devuelve summary y highlights. No inventes.",
  risk_review: "Clasifica posibles patrones de acoso, amenaza, fraude o presión. Devuelve severity, category, reasons y requires_human_review. Nunca sanciones automáticamente.",
  capsule_summary: "Crea un recuerdo breve y positivo usando solo los textos recibidos. Devuelve title, summary y highlights; omite datos sensibles.",
  annual_recap: "Crea un resumen anual compartible y respetuoso. Devuelve headline, summary y highlights basados solo en métricas recibidas.",
  weather_backup: "Sugiere una alternativa interior cercana y logística preventiva. Devuelve alert, indoor_backup y checklist; aclara si faltan datos meteorológicos.",
};

function planFallback(input: Record<string, unknown>) {
  const idea = String(input.idea ?? "Plan con gente nueva").trim();
  const lower = idea.toLowerCase();
  const category = lower.includes("correr") || lower.includes("running") ? "Running"
    : lower.includes("café") || lower.includes("desay") ? "Café"
      : lower.includes("sender") ? "Senderismo"
        : lower.includes("pádel") ? "Pádel"
          : lower.includes("idioma") ? "Idiomas" : "Nuevos en la ciudad";
  return {
    title: idea.slice(0, 70),
    description: `${idea}. Un plan cercano, claro y acogedor para compartir la experiencia con buen ambiente.`,
    category,
    level: "all",
    atmosphere: "social",
    duration_hours: 2,
    requirements: ["Puntualidad", "Respeto", "Confirmar asistencia"],
    indoor_backup: "Confirmar un punto interior cercano si cambia el tiempo",
    newcomer_friendly: true,
  };
}

function fallback(task: string, input: Record<string, unknown>) {
  if (task === "plan_draft") return { result: planFallback(input), mode: "heuristic", estimated: true };
  if (task === "risk_review") return { result: { severity: "unknown", category: "manual_review", reasons: ["La IA no está disponible"], requires_human_review: true }, mode: "safe_fallback", estimated: true };
  return { result: { summary: "La IA no está disponible en este momento. Conservamos el contenido sin inventar un resumen.", highlights: [] }, mode: "safe_fallback", estimated: true };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Método no permitido" }, 405);
  try {
    const token=(request.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
    const authClient=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:{user},error:authError}=await authClient.auth.getUser(token);
    if(authError||!user)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers:{...cors,"Content-Type":"application/json"}});

    const body = await request.json().catch(() => ({}));
    const task = String(body?.task ?? "");
    const input = body?.input && typeof body.input === "object" ? body.input as Record<string, unknown> : {};
    if (!taskInstructions[task]) return json({ error: "Tarea no permitida" }, 400);
    const serialized = JSON.stringify(input);
    if (serialized.length > 30_000) return json({ error: "Contexto demasiado grande" }, 413);

    const key = Deno.env.get("OPENAI_API_KEY") ?? "";
    if (!key) return json(fallback(task, input));
    const model = Deno.env.get("PRODUCT_AI_MODEL") || Deno.env.get("ROBOT_AI_MODEL") || "gpt-5.4";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 1400,
        instructions: `Eres la IA de producto de CONECTA. Responde solo JSON válido. ${taskInstructions[task]} Distingue hechos y estimaciones. No infieras salud, orientación, origen, religión ni otros atributos sensibles. La seguridad humana siempre requiere revisión humana.`,
        input: serialized,
      }),
    });
    const data = await response.json();
    if (!response.ok) return json({ ...fallback(task, input), providerError: data?.error?.message ?? "Error del proveedor" });
    const output = (data?.output ?? []).flatMap((item: any) => item?.content ?? []).find((item: any) => item?.type === "output_text")?.text ?? "";
    const cleaned = String(output).trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    try {
      return json({ result: JSON.parse(cleaned), mode: "ai", estimated: false, model });
    } catch {
      return json({ ...fallback(task, input), providerError: "La respuesta no tenía JSON válido" });
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
