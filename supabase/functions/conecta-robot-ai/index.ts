import { createClient } from "npm:@supabase/supabase-js@2.115.0";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
};

function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json"}})}

function fallback(question:string,context:any){
  const report=context?.audit||{};
  const s=report?.summary||{};
  const recs=Array.isArray(report?.recommendations)?report.recommendations:[];
  const top=recs.slice(0,3).map((r:any,i:number)=>`${i+1}. ${r.title||"Mejora"}${r.detail?`: ${r.detail}`:""}`).join("\n");
  const health=report?.health||"sin confirmar";
  const score=Number.isFinite(report?.score)?`${report.score}/100`:"sin puntuación";
  const q=question.toLowerCase();
  let answer=`Estado actual: ${health}, ${score}.`;
  if(q.includes("roto")||q.includes("fall")) answer+=` Errores comprobados: ${s.failed??"?"}; avisos: ${s.warnings??"?"}; no probado: ${s.notTested??"?"}.`;
  else if(q.includes("primero")||q.includes("prior")) answer+= top?`\nPrioridades:\n${top}`:" No hay prioridades cargadas en el último informe.";
  else if(q.includes("public")) answer+=` Para publicar no basta la nota: deben pasar Auth, borrado de cuenta, privacidad/RLS, chat multiusuario, Storage y pruebas E2E.`;
  else answer+= top?`\nSiguiente trabajo recomendado:\n${top}`:" Necesito un informe más reciente para concretar.";
  return {answer,mode:"deterministic",estimated:true};
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return json({error:"Método no permitido"},405);
  try{
    const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
    const authClient=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:{user},error:authError}=await authClient.auth.getUser(token);
    if(authError||!user)return new Response(JSON.stringify({error:"unauthorized"}),{status:401,headers:{...cors,"Content-Type":"application/json"}});

    const body=await req.json().catch(()=>({}));
    const question=String(body?.question||"").trim().slice(0,2000);
    const context=body?.context||{};
    if(!question) return json({error:"Falta la pregunta"},400);

    const key=Deno.env.get("OPENAI_API_KEY")||"";
    if(!key) return json(fallback(question,context));

    const model=Deno.env.get("ROBOT_AI_MODEL")||"gpt-5.4";
    const compact={
      audit:context?.audit||null,
      github:context?.github||null,
      pwa:context?.pwa||null,
      supabase:context?.supabase||null,
      repairs:context?.repairs||null,
      userQuestion:question
    };
    const response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        model,
        store:false,
        max_output_tokens:1200,
        instructions:"Eres la IA técnica de CONECTA Robot. Responde en español claro. Usa solo el contexto técnico recibido. Distingue hechos comprobados, riesgos y estimaciones. Nunca afirmes que algo funciona si no fue probado. No pidas ni muestres contraseñas, tokens, claves privadas o datos personales. No propongas modificar main directamente: las reparaciones deben ir a una rama/PR y requerir aprobación humana.",
        input:JSON.stringify(compact)
      })
    });
    const data=await response.json();
    if(!response.ok) return json({...fallback(question,context),providerError:data?.error?.message||"Error del proveedor"},200);
    const texts=(data?.output||[]).flatMap((o:any)=>o?.content||[]).filter((c:any)=>c?.type==="output_text").map((c:any)=>c.text).filter(Boolean);
    const answer=texts.join("\n").trim();
    if(!answer) return json(fallback(question,context));
    return json({answer,mode:"ai",estimated:false,model});
  }catch(error){
    return json({error:error instanceof Error?error.message:String(error)},500);
  }
});
