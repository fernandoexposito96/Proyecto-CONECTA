import { createClient } from "npm:@supabase/supabase-js@2.115.0";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });
  try {
    const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
    const authClient=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:{user},error:authError}=await authClient.auth.getUser(token);
    if(authError||!user)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers:{...cors,"Content-Type":"application/json"}});

    const body = await req.json();
    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return new Response(JSON.stringify({ error: "invalid_location" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("current", "temperature_2m,precipitation,rain,weather_code,is_day");
    url.searchParams.set("timezone", "auto");
    const weatherResponse = await fetch(url, { headers: { Accept: "application/json" } });
    if (!weatherResponse.ok) throw new Error("weather_unavailable");
    const weather = await weatherResponse.json();
    const current = weather?.current ?? {};
    const rainy = Number(current.rain ?? 0) > 0 || Number(current.precipitation ?? 0) > 0 || [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(Number(current.weather_code));
    const hour = new Date().getHours();
    const categories = rainy
      ? ["Café", "Gimnasio", "Cine", "Idiomas", "Juegos"]
      : hour < 12
        ? ["Running", "Café", "Senderismo", "Gimnasio"]
        : hour < 18
          ? ["Pádel", "Café", "Fotografía", "Senderismo"]
          : ["Cena", "Música", "Fiesta", "Cine"];
    const message = rainy
      ? "Parece mejor momento para planes indoor."
      : hour < 12
        ? "La mañana encaja bien con deporte y desayuno."
        : hour < 18
          ? "Buena franja para actividad y planes sociales."
          : "La tarde-noche favorece ocio, cena y música.";
    return new Response(JSON.stringify({ weather: { temperature: current.temperature_2m ?? null, weather_code: current.weather_code ?? null, rainy, is_day: Boolean(current.is_day) }, categories, message }), { headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    console.error("conecta-context", error);
    return new Response(JSON.stringify({ error: "context_unavailable" }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
