export {};

const LANG_KEY='conecta-ui-lang-v1';
const A11Y_KEY='conecta-a11y-v1';
const ONBOARDING_KEY='conecta-icebreakers-v1';

type Lang='es'|'ca'|'en';

type A11yState={largeText:boolean;highContrast:boolean};

const textMap:Record<Lang,Record<string,string>>={
  es:{Inicio:'Inicio',Explora:'Explora',Chat:'Chat',Perfil:'Perfil','Planes para ti':'Planes para ti','Personas para ti':'Personas para ti','Tu próximo plan':'Tu próximo plan','Editar perfil':'Editar perfil','Cerrar sesión':'Cerrar sesión'},
  ca:{Inicio:'Inici',Explora:'Explora',Chat:'Xat',Perfil:'Perfil','Planes para ti':'Plans per a tu','Personas para ti':'Persones per a tu','Tu próximo plan':'El teu proper pla','Editar perfil':'Edita el perfil','Cerrar sesión':'Tanca la sessió'},
  en:{Inicio:'Home',Explora:'Explore',Chat:'Chat',Perfil:'Profile','Planes para ti':'Plans for you','Personas para ti':'People for you','Tu próximo plan':'Your next plan','Editar perfil':'Edit profile','Cerrar sesión':'Log out'}
};

function loadA11y():A11yState{try{return {...{largeText:false,highContrast:false},...JSON.parse(localStorage.getItem(A11Y_KEY)||'{}')}}catch{return {largeText:false,highContrast:false}}}
function saveA11y(v:A11yState){localStorage.setItem(A11Y_KEY,JSON.stringify(v));applyA11y(v)}
function applyA11y(v:A11yState){document.documentElement.classList.toggle('conecta-large-text',v.largeText);document.documentElement.classList.toggle('conecta-high-contrast',v.highContrast)}
applyA11y(loadA11y());

function translateInterface(root:ParentNode=document){
  const lang=(localStorage.getItem(LANG_KEY)||'es') as Lang;
  document.documentElement.lang=lang;
  const dict=textMap[lang];
  root.querySelectorAll<HTMLElement>('button,span,strong,h1,h2,h3').forEach(el=>{
    const source=el.dataset.i18nSource||el.textContent?.trim()||'';
    if(dict[source]){el.dataset.i18nSource=source;el.textContent=dict[source];}
  });
}

function addAccessibilityAndLanguage(root:ParentNode=document){
  const settings=root.querySelector<HTMLElement>('.settings-page');
  if(!settings||settings.querySelector('.conecta-access-card')) return;
  const state=loadA11y();
  const lang=(localStorage.getItem(LANG_KEY)||'es') as Lang;
  const card=document.createElement('section');
  card.className='conecta-access-card';
  card.innerHTML=`<h3>Accesibilidad e idioma</h3><p>Ajusta lectura, contraste e idioma de la interfaz.</p><div class="conecta-access-actions"><button data-a11y="large" class="${state.largeText?'active':''}">Texto grande</button><button data-a11y="contrast" class="${state.highContrast?'active':''}">Alto contraste</button></div><div class="conecta-lang-switch"><button data-lang="es" class="${lang==='es'?'active':''}">ES</button><button data-lang="ca" class="${lang==='ca'?'active':''}">CA</button><button data-lang="en" class="${lang==='en'?'active':''}">EN</button></div></section>`;
  settings.prepend(card);
  card.querySelectorAll<HTMLButtonElement>('[data-a11y]').forEach(btn=>btn.addEventListener('click',()=>{
    const s=loadA11y(); if(btn.dataset.a11y==='large') s.largeText=!s.largeText; else s.highContrast=!s.highContrast; saveA11y(s); btn.classList.toggle('active');
  }));
  card.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach(btn=>btn.addEventListener('click',()=>{localStorage.setItem(LANG_KEY,btn.dataset.lang||'es');location.reload();}));
}

function addIcebreakers(root:ParentNode=document){
  const home=root.querySelector<HTMLElement>('.home-page');
  if(!home||home.querySelector('.icebreaker-card')||localStorage.getItem(ONBOARDING_KEY)==='dismissed') return;
  const firstSection=home.querySelector('.section');
  const box=document.createElement('section');
  box.className='icebreaker-card';
  box.innerHTML=`<div><small>PARA EMPEZAR</small><h2>3 planes para romper el hielo</h2><p>Una selección inicial según deporte, viajes y conocer gente nueva.</p></div><div class="icebreaker-list"><button><b>Pádel Sunset</b><span>Hoy · 19:00</span></button><button><b>Café y gente nueva</b><span>Mañana · 17:30</span></button><button><b>Running por la costa</b><span>Dom · 09:00</span></button></div><button class="icebreaker-close">Ya he empezado</button>`;
  firstSection?.parentElement?.insertBefore(box,firstSection);
  box.querySelectorAll<HTMLButtonElement>('.icebreaker-list button').forEach(btn=>btn.addEventListener('click',()=>document.querySelector<HTMLElement>('.plan-card')?.scrollIntoView({behavior:'smooth'})));
  box.querySelector<HTMLButtonElement>('.icebreaker-close')?.addEventListener('click',()=>{localStorage.setItem(ONBOARDING_KEY,'dismissed');box.remove();});
}

function addProfileVideo(root:ParentNode=document){
  const profile=root.querySelector<HTMLElement>('.profile-main');
  if(!profile||profile.querySelector('.profile-video-card')) return;
  const tabs=profile.querySelector('.profile-tabs');
  const card=document.createElement('section');
  card.className='profile-video-card';
  card.innerHTML=`<div><strong>Vídeo de presentación</strong><span>Opcional · máximo 15 segundos</span></div><video controls playsinline hidden></video><label>Grabar o elegir vídeo<input type="file" accept="video/*" capture="user" hidden></label><small class="video-status">Da más contexto y confianza que una foto sola.</small>`;
  tabs?.parentElement?.insertBefore(card,tabs);
  const input=card.querySelector<HTMLInputElement>('input'); const video=card.querySelector<HTMLVideoElement>('video'); const status=card.querySelector<HTMLElement>('.video-status');
  input?.addEventListener('change',()=>{const f=input.files?.[0];if(!f||!video)return;const url=URL.createObjectURL(f);video.src=url;video.hidden=false;video.onloadedmetadata=()=>{if(video.duration>15){video.hidden=true;video.removeAttribute('src');if(status)status.textContent='El vídeo supera 15 segundos. Elige uno más corto.';}else if(status)status.textContent='Vídeo listo para usar en tu perfil.';};});
}

function addFriendshipTimeline(root:ParentNode=document){
  const profile=root.querySelector<HTMLElement>('.profile-main');
  if(!profile||profile.querySelector('.friendship-timeline')) return;
  const grid=profile.querySelector('.photo-grid');
  const section=document.createElement('section');
  section.className='friendship-timeline';
  section.innerHTML=`<div class="timeline-head"><small>RECUERDOS</small><h2>Amistades nacidas en CONECTA</h2></div><article><span>●</span><div><strong>Marta</strong><p>Os conocisteis en Running por la costa</p><small>Hace 3 meses</small></div></article><article><span>●</span><div><strong>Javi</strong><p>Coincidisteis por primera vez en Pádel Sunset</p><small>Hace 2 meses</small></div></article><article><span>●</span><div><strong>Laura</strong><p>Primera conexión en Tarde de playa</p><small>Hace 5 semanas</small></div></article>`;
  grid?.after(section);
}

function maybeShowRetentionReminder(root:ParentNode=document){
  const home=root.querySelector<HTMLElement>('.home-page'); if(!home||home.querySelector('.retention-reminder')) return;
  const days=8; // demo local until backend activity is wired
  if(days<7) return;
  const n=document.createElement('section');n.className='retention-reminder';n.innerHTML=`<div><small>TE HEMOS ECHADO DE MENOS</small><h3>¿Todo bien?</h3><p>Hace unos días que no te apuntas a ningún plan. Aquí tienes algo para esta semana.</p></div><button>Ver planes</button>`;
  home.prepend(n);n.querySelector('button')?.addEventListener('click',()=>document.querySelector<HTMLElement>('.plan-card')?.scrollIntoView({behavior:'smooth'}));
}

function applyEnhancements(){translateInterface();addAccessibilityAndLanguage();addIcebreakers();addProfileVideo();addFriendshipTimeline();maybeShowRetentionReminder();}
applyEnhancements();
const retentionObserver=new MutationObserver(applyEnhancements);retentionObserver.observe(document.body,{childList:true,subtree:true});
