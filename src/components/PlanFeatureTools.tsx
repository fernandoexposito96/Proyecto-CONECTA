import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Link2, MessageCircle, ShieldCheck, Vote } from 'lucide-react';
import { createPlanInvite, createPlanPoll, issuePlanCheckinCode, loadPlanPolls, votePlanPoll, checkinWithCode, type PlanPoll } from '../lib/planFeaturesBackend';
import { finishSafetySession, safetySmsUrl, startSafetySession, type SafetySession } from '../lib/safetyBackend';
import type { Plan } from '../types';

function errorMessage(error:unknown){
  return error instanceof Error?error.message:'No se ha podido completar la acción.';
}

export function PlanFeatureTools({plan,onOpenChat}:{plan:Plan;onOpenChat?:(name:string,planId?:string)=>void}){
  const planId=plan.backendId||'';
  const [polls,setPolls]=useState<PlanPoll[]>([]);
  const [pollLoading,setPollLoading]=useState(Boolean(planId));
  const [pollError,setPollError]=useState('');
  const [showPollForm,setShowPollForm]=useState(false);
  const [question,setQuestion]=useState('¿Qué hora nos viene mejor?');
  const [options,setOptions]=useState('18:00\n19:00\n20:00');
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const [checkinCode,setCheckinCode]=useState('');
  const [issuedCode,setIssuedCode]=useState('');
  const [safety,setSafety]=useState<SafetySession|null>(null);

  const refreshPolls=async()=>{
    if(!planId){setPolls([]);setPollLoading(false);return;}
    setPollLoading(true);
    try{
      setPolls(await loadPlanPolls(planId));
      setPollError('');
    }catch(error){
      setPolls([]);
      setPollError(errorMessage(error));
    }finally{
      setPollLoading(false);
    }
  };

  useEffect(()=>{void refreshPolls()},[planId]);

  const shareInvite=async()=>{
    if(!planId)return;
    setBusy(true);setNotice('');
    try{
      const invite=await createPlanInvite(planId);
      if(navigator.share){
        await navigator.share({title:`Únete a ${plan.title}`,text:`Te invito a este plan en CONECTA: ${plan.title}`,url:invite.url});
        setNotice('Invitación preparada para compartir.');
      }else{
        await navigator.clipboard.writeText(invite.url);
        setNotice('Enlace de invitación copiado.');
      }
    }catch(error){setNotice(errorMessage(error))}
    finally{setBusy(false)}
  };

  const submitPoll=async()=>{
    if(!planId)return;
    setBusy(true);setNotice('');
    try{
      await createPlanPoll(planId,question,options.split(/\n|,/));
      setShowPollForm(false);
      await refreshPolls();
      setNotice('Encuesta creada para el grupo.');
    }catch(error){setNotice(errorMessage(error))}
    finally{setBusy(false)}
  };

  const vote=async(poll:PlanPoll,optionId:string)=>{
    setBusy(true);setNotice('');
    try{
      await votePlanPoll(poll,optionId);
      await refreshPolls();
    }catch(error){setNotice(errorMessage(error))}
    finally{setBusy(false)}
  };

  const generateCheckin=async()=>{
    if(!planId)return;
    setBusy(true);setNotice('');
    try{
      const code=await issuePlanCheckinCode(planId);
      setIssuedCode(code);
      setNotice('Código de check-in generado.');
    }catch(error){setNotice(errorMessage(error))}
    finally{setBusy(false)}
  };

  const doCheckin=async()=>{
    setBusy(true);setNotice('');
    try{
      await checkinWithCode(checkinCode);
      setCheckinCode('');
      setNotice('Check-in confirmado.');
    }catch(error){setNotice(errorMessage(error))}
    finally{setBusy(false)}
  };

  const startSafety=async()=>{
    setBusy(true);setNotice('');
    try{
      const session=await startSafetySession(planId||undefined);
      setSafety(session);
      setNotice(`Modo seguridad activo con ${session.contact.name}.`);
      window.location.href=safetySmsUrl(session.contact,plan.title,false);
    }catch(error){setNotice(errorMessage(error))}
    finally{setBusy(false)}
  };

  const finishSafety=async()=>{
    if(!safety)return;
    setBusy(true);setNotice('');
    try{
      await finishSafetySession(safety.id);
      window.location.href=safetySmsUrl(safety.contact,plan.title,true);
      setSafety(null);
      setNotice('Sesión de seguridad finalizada.');
    }catch(error){setNotice(errorMessage(error))}
    finally{setBusy(false)}
  };

  if(!planId)return <div className="plan-tools plan-tools-demo"><strong>Herramientas del plan</strong><p>Encuestas, invitaciones y check-in se activan en planes sincronizados con CONECTA. Este plan sigue siendo parte del demo actual.</p></div>;

  return <section className="plan-tools" aria-label="Herramientas del plan">
    <div className="plan-tools-head"><div><small>GRUPO</small><strong>Herramientas del plan</strong></div><div className="plan-tools-actions"><button type="button" disabled={busy} onClick={()=>{void shareInvite()}}><Link2/> Invitar</button>{onOpenChat&&<button type="button" onClick={()=>onOpenChat(plan.title,planId)}><MessageCircle/> Chat</button>}</div></div>

    <div className="plan-tool-card">
      <div className="plan-tool-title"><Vote/><div><strong>Encuesta de grupo</strong><span>Decidid sitio u hora antes de confirmar.</span></div><button type="button" disabled={busy} onClick={()=>setShowPollForm(value=>!value)}>{showPollForm?'Cerrar':'+ Nueva'}</button></div>
      {showPollForm&&<div className="plan-poll-form"><label>Pregunta<input value={question} maxLength={240} onChange={event=>setQuestion(event.target.value)}/></label><label>Opciones<textarea value={options} onChange={event=>setOptions(event.target.value)} placeholder="Una opción por línea"/></label><button type="button" disabled={busy} onClick={()=>{void submitPoll()}}>Crear encuesta</button></div>}
      {pollLoading&&<small>Cargando encuestas…</small>}
      {!pollLoading&&polls.map(poll=><div className="plan-poll" key={poll.id}><strong>{poll.question}</strong>{poll.options.map(option=><button type="button" key={option.id} disabled={busy} className={option.votedByMe?'is-selected':''} onClick={()=>{void vote(poll,option.id)}}><span>{option.label}</span><b>{option.votes}</b></button>)}</div>)}
      {!pollLoading&&!polls.length&&!pollError&&<small>Aún no hay encuestas en este plan.</small>}
      {pollError&&<small className="plan-tool-error">{pollError}</small>}
    </div>

    <div className="plan-tool-card">
      <div className="plan-tool-title"><ClipboardCheck/><div><strong>Check-in</strong><span>Confirma asistencia con un código seguro.</span></div></div>
      <div className="plan-checkin-row"><input value={checkinCode} onChange={event=>setCheckinCode(event.target.value)} placeholder="Código" aria-label="Código de check-in"/><button type="button" disabled={busy||!checkinCode.trim()} onClick={()=>{void doCheckin()}}>Confirmar</button></div>
      <button type="button" className="plan-tool-secondary" disabled={busy} onClick={()=>{void generateCheckin()}}>Generar código si organizas</button>
      {issuedCode&&<div className="plan-issued-code"><CheckCircle2/><span>Código activo</span><strong>{issuedCode}</strong></div>}
    </div>

    <div className="plan-tool-card">
      <div className="plan-tool-title"><ShieldCheck/><div><strong>Check-in de seguridad</strong><span>Registra una sesión y prepara el aviso a tu contacto de emergencia.</span></div></div>
      {safety?<button type="button" className="plan-safety-active" disabled={busy} onClick={()=>{void finishSafety()}}>Estoy bien · finalizar seguridad</button>:<button type="button" className="plan-tool-secondary" disabled={busy} onClick={()=>{void startSafety()}}>Activar modo seguridad</button>}
    </div>

    {notice&&<p className="plan-tool-notice" role="status">{notice}</p>}
  </section>;
}
