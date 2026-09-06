export {};

const FEATURE_KEY = 'conecta-experience-features-v1';

type FeatureState = {
  streak?: number;
  weekOnly?: boolean;
  reminderPlans?: string[];
  pollVotes?: Record<string,string>;
  selfieSent?: boolean;
  safetyPhone?: string;
};

function loadFeatureState(): FeatureState {
  try { return JSON.parse(localStorage.getItem(FEATURE_KEY) || '{}') as FeatureState; }
  catch { return {}; }
}
function saveFeatureState(patch: Partial<FeatureState>) {
  const next = {...loadFeatureState(), ...patch};
  localStorage.setItem(FEATURE_KEY, JSON.stringify(next));
  return next;
}
function featureSlug(v:string){return v.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9áéíóúüñ-]/gi,'')}
function toast(msg:string){
  let el=document.querySelector<HTMLElement>('.conecta-toast');
  if(!el){el=document.createElement('div');el.className='conecta-toast';document.body.appendChild(el)}
  el.textContent=msg;el.classList.add('show');window.setTimeout(()=>el?.classList.remove('show'),2200);
}

function openWrapped(){
  document.querySelector('.wrapped-modal')?.remove();
  const state=loadFeatureState();
  const actions=(()=>{try{return Object.keys(JSON.parse(localStorage.getItem('conecta-ux-actions-v1')||'{}')).length}catch{return 0}})();
  const modal=document.createElement('div');modal.className='wrapped-modal';
  modal.innerHTML=`<div class="wrapped-card"><button class="wrapped-close" aria-label="Cerrar">×</button><small>CONECTA WRAPPED</small><h2>Tu semana en CONECTA</h2><div class="wrapped-stats"><div><b>${state.streak||3}</b><span>días de racha</span></div><div><b>${actions}</b><span>interacciones</span></div><div><b>2</b><span>planes guardados</span></div><div><b>5</b><span>personas nuevas</span></div></div><p>Más planes, más gente y más experiencias reales.</p></div>`;
  document.body.appendChild(modal);modal.querySelector('button')?.addEventListener('click',()=>modal.remove());
  modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});
}

function enhanceHome(){
  const home=document.querySelector<HTMLElement>('.home-page'); if(!home || home.querySelector('.week-dashboard')) return;
  const state=loadFeatureState();
  const section=document.createElement('section');section.className='section week-dashboard';
  section.innerHTML=`<div class="section-head"><div><small>TU SEMANA</small><h2>Tu ritmo en CONECTA</h2></div><button class="wrapped-open">Ver Wrapped ›</button></div>
  <div class="week-cards">
    <article class="streak-card"><span>🔥</span><div><b>${state.streak||3} semanas seguidas</b><small>Mantén tu racha apuntándote a un plan esta semana</small></div></article>
    <article class="next-plan-widget"><small>TU PRÓXIMO PLAN</small><b>Pádel Sunset</b><span>Hoy · 19:00 · Club Pádel Tarragona</span><button data-open-next>Ver plan</button></article>
  </div>
  <label class="week-only"><span><b>Solo esta semana</b><small>Prioriza en el calendario los próximos 7 días</small></span><input type="checkbox" ${state.weekOnly?'checked':''}></label>`;
  const anchor=home.querySelector('.now-section') || home.querySelector('.section'); anchor?.insertAdjacentElement('afterend',section);
  section.querySelector('.wrapped-open')?.addEventListener('click',openWrapped);
  section.querySelector<HTMLInputElement>('.week-only input')?.addEventListener('change',e=>{const checked=(e.currentTarget as HTMLInputElement).checked;saveFeatureState({weekOnly:checked});document.body.classList.toggle('week-only-mode',checked);toast(checked?'Calendario: solo esta semana':'Calendario completo')});
  section.querySelector('[data-open-next]')?.addEventListener('click',()=>{const card=[...document.querySelectorAll<HTMLElement>('.plan-card')].find(c=>c.querySelector('h3')?.textContent?.includes('Pádel Sunset'));card?.click()});
  document.body.classList.toggle('week-only-mode',!!state.weekOnly);
}

function addPoll(container:HTMLElement, planKey:string){
  if(container.querySelector('.plan-poll'))return;
  const state=loadFeatureState();const selected=state.pollVotes?.[planKey]||'';
  const poll=document.createElement('section');poll.className='plan-extra plan-poll';
  poll.innerHTML=`<div><small>ENCUESTA DEL GRUPO</small><h3>¿Qué opción prefieres antes de confirmar?</h3></div><div class="poll-options"><button data-vote="19:00" class="${selected==='19:00'?'selected':''}">19:00 <span>5 votos</span></button><button data-vote="20:00" class="${selected==='20:00'?'selected':''}">20:00 <span>3 votos</span></button><button data-vote="Terraza" class="${selected==='Terraza'?'selected':''}">Terraza <span>7 votos</span></button></div>`;
  container.appendChild(poll);
  poll.querySelectorAll<HTMLButtonElement>('[data-vote]').forEach(b=>b.addEventListener('click',()=>{const s=loadFeatureState();saveFeatureState({pollVotes:{...(s.pollVotes||{}),[planKey]:b.dataset.vote||''}});poll.querySelectorAll('button').forEach(x=>x.classList.toggle('selected',x===b));toast('Voto guardado')}));
}

function addInvite(container:HTMLElement,title:string){
  if(container.querySelector('.public-invite'))return;
  const box=document.createElement('section');box.className='plan-extra public-invite';
  box.innerHTML=`<div><small>INVITACIÓN PÚBLICA</small><h3>Invita a alguien aunque no tenga CONECTA</h3><p>El enlace abre el plan y permite registro exprés.</p></div><button>Compartir enlace</button>`;container.appendChild(box);
  box.querySelector('button')?.addEventListener('click',async()=>{const url=`${location.origin}${location.pathname}?plan=${encodeURIComponent(featureSlug(title))}&invite=1`;try{if(navigator.share)await navigator.share({title:`Únete a ${title}`,text:'Te invito a este plan en CONECTA',url});else{await navigator.clipboard.writeText(url);toast('Enlace copiado')}}catch{}});
}

function addReminder(container:HTMLElement,planKey:string){
  if(container.querySelector('.plan-reminder'))return; const state=loadFeatureState(); const active=(state.reminderPlans||[]).includes(planKey);
  const row=document.createElement('section');row.className='plan-extra plan-reminder';row.innerHTML=`<div><small>RECORDATORIO</small><h3>Avísame 1 h antes</h3><p>Acceso directo al chat del plan.</p></div><button class="${active?'active':''}">${active?'Activado':'Activar'}</button>`;container.appendChild(row);
  row.querySelector('button')?.addEventListener('click',async()=>{const s=loadFeatureState();const list=new Set(s.reminderPlans||[]);if(list.has(planKey))list.delete(planKey);else list.add(planKey);saveFeatureState({reminderPlans:[...list]});const on=list.has(planKey);const b=row.querySelector('button')!;b.textContent=on?'Activado':'Activar';b.classList.toggle('active',on);if(on && 'Notification' in window && Notification.permission==='default')await Notification.requestPermission();toast(on?'Recordatorio configurado':'Recordatorio desactivado')});
}

function addWatch(container:HTMLElement){
  if(container.querySelector('.watch-summary'))return;
  const box=document.createElement('section');box.className='plan-extra watch-summary';box.innerHTML=`<div><small>RELOJ INTELIGENTE</small><h3>Resumen post-plan</h3><p>Calorías, km y ritmo cardíaco medio.</p></div><div class="watch-metrics"><span>🔥 -- kcal</span><span>📍 -- km</span><span>❤️ -- ppm</span></div><button>Conectar reloj</button><small class="native-note">Preparado para HealthKit / Google Health Connect.</small>`;container.appendChild(box);box.querySelector('button')?.addEventListener('click',()=>toast('Requiere conexión nativa con HealthKit/Health Connect'));
}

function addSafety(container:HTMLElement,title:string){
  if(container.querySelector('.safety-checkin'))return;
  const box=document.createElement('section');box.className='plan-extra safety-checkin';box.innerHTML=`<div><small>SEGURIDAD</small><h3>Check-in “he llegado bien”</h3><p>Envía un aviso a tu contacto de emergencia.</p></div><button>He llegado bien</button>`;container.appendChild(box);
  box.querySelector('button')?.addEventListener('click',async()=>{let phone=loadFeatureState().safetyPhone||prompt('Teléfono del contacto de emergencia')||'';if(!phone)return;saveFeatureState({safetyPhone:phone});let text=`He llegado bien al plan “${title}” en CONECTA.`;try{const pos=await new Promise<GeolocationPosition>((res,rej)=>navigator.geolocation?navigator.geolocation.getCurrentPosition(res,rej,{timeout:3500}):rej());text+=` Ubicación: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`}catch{};location.href=`sms:${encodeURIComponent(phone)}&body=${encodeURIComponent(text)}`});
}

function enhancePlanDetail(){
  document.querySelectorAll<HTMLElement>('.detail-body').forEach(body=>{if(body.dataset.experienceEnhanced)return;body.dataset.experienceEnhanced='1';const title=body.querySelector('h1')?.textContent||'Plan CONECTA';const key=featureSlug(title);const anchor=body.querySelector('.join');const extras=document.createElement('div');extras.className='plan-extras';anchor?.insertAdjacentElement('beforebegin',extras);addPoll(extras,key);addInvite(extras,title);addReminder(extras,key);addWatch(extras);addSafety(extras,title)});
}

function enhanceProfile(){
  const profile=document.querySelector<HTMLElement>('.profile-main');if(!profile||profile.querySelector('.selfie-verify'))return;const state=loadFeatureState();const card=document.createElement('section');card.className='selfie-verify';card.innerHTML=`<div><small>CONFIANZA</small><h3>Verificación por selfie</h3><p>${state.selfieSent?'Selfie enviada para revisión.':'Opcional · refuerza la confianza del perfil y puede mejorar recomendaciones.'}</p></div><button ${state.selfieSent?'disabled':''}>${state.selfieSent?'En revisión':'Verificarme'}</button><input type="file" accept="image/*" capture="user" hidden>`;const tags=profile.querySelector('.profile-tags');tags?.insertAdjacentElement('afterend',card);const input=card.querySelector<HTMLInputElement>('input')!;card.querySelector('button')?.addEventListener('click',()=>input.click());input.addEventListener('change',()=>{if(!input.files?.length)return;saveFeatureState({selfieSent:true});card.querySelector('p')!.textContent='Selfie enviada para revisión.';const b=card.querySelector('button')!;b.textContent='En revisión';b.setAttribute('disabled','');toast('Selfie preparada para verificación')});
}

function applyExperienceFeatures(){enhanceHome();enhancePlanDetail();enhanceProfile()}
applyExperienceFeatures();
const experienceObserver=new MutationObserver(()=>applyExperienceFeatures());
experienceObserver.observe(document.body,{childList:true,subtree:true});
