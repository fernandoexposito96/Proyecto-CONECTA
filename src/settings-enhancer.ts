type SettingSection = 'Ajustes'|'Privacidad y seguridad'|'Guía CONECTA'|'Normas de la comunidad'|'Centro de ayuda'|'Invitar amigos'|'Sobre CONECTA';

type ThemePrefs={bg:string;accent:string;text:string;radius:number;fontScale:number;compact:boolean};
const KEY='conecta-ui-prefs-v1';
const defaults:ThemePrefs={bg:'#f7f4ff',accent:'#6f46ff',text:'#17213e',radius:20,fontScale:100,compact:false};

function loadPrefs():ThemePrefs{try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return defaults}}
function applyPrefs(p:ThemePrefs){
  const r=document.documentElement;
  r.style.setProperty('--lav-bg',p.bg);r.style.setProperty('--lav-primary',p.accent);r.style.setProperty('--lav-ink',p.text);
  r.style.setProperty('--user-radius',`${p.radius}px`);r.style.setProperty('--user-font-scale',`${p.fontScale/100}`);
  document.body.dataset.compact=p.compact?'1':'0';localStorage.setItem(KEY,JSON.stringify(p));
}
applyPrefs(loadPrefs());

const sectionCopy:Record<SettingSection,{title:string;subtitle:string;html:string}>={
'Ajustes':{title:'Ajustes',subtitle:'Personaliza tu experiencia CONECTA',html:`
<section class="settings-max-card"><h3>Apariencia</h3><p>Personaliza colores, tamaño y densidad de toda la aplicación.</p><div class="theme-grid">
<label>Fondo <input data-pref="bg" type="color"></label><label>Color principal <input data-pref="accent" type="color"></label><label>Color de texto <input data-pref="text" type="color"></label>
<label>Redondeado <input data-pref="radius" type="range" min="10" max="32"></label><label>Tamaño de letra <input data-pref="fontScale" type="range" min="90" max="115"></label></div>
<div class="preset-row"><button data-preset="lavender">Lavender</button><button data-preset="clean">Claro</button><button data-preset="night">Noche</button><button data-preset="ocean">Océano</button></div>
<label class="switch-row"><span><b>Vista compacta</b><small>Reduce espacios y muestra más contenido</small></span><input data-pref="compact" type="checkbox"></label>
<button class="settings-reset">Restablecer diseño CONECTA</button></section>
<section class="settings-max-card"><h3>Experiencia</h3>${toggles(['Reproducción automática de vídeos','Animaciones de interfaz','Sonidos de interacción','Vibración y respuesta háptica','Previsualizaciones en chat','Mostrar actividad reciente'])}</section>
<section class="settings-max-card"><h3>Notificaciones</h3>${toggles(['Nuevos mensajes','Invitaciones a planes','Cambios en mis planes','Personas compatibles','Recordatorios de asistencia','Novedades y recomendaciones'])}</section>
<section class="settings-max-card"><h3>Idioma y accesibilidad</h3><div class="option-line"><span><b>Idioma</b><small>Español</small></span><button>Español ›</button></div>${toggles(['Texto de alto contraste','Reducir movimiento','Etiquetas accesibles','Aumentar zonas táctiles'])}</section>`},
'Privacidad y seguridad':{title:'Privacidad y seguridad',subtitle:'Control completo sobre tu cuenta y tus datos',html:`
<section class="settings-max-card"><h3>Privacidad del perfil</h3>${toggles(['Perfil visible en recomendaciones','Mostrar distancia aproximada','Mostrar estado online','Permitir solicitudes de conexión','Mostrar planes a los que asisto'])}</section>
<section class="settings-max-card"><h3>Seguridad</h3>${toggles(['Inicio de sesión con Face ID / biometría','Avisos de inicio de sesión nuevo','Confirmación antes de acciones sensibles','Bloqueo de capturas en contenido privado'])}<div class="option-line"><span><b>Dispositivos con sesión iniciada</b><small>Revisa y cierra accesos desconocidos</small></span><button>Revisar ›</button></div><div class="option-line"><span><b>Cambiar contraseña</b><small>Actualiza tus credenciales</small></span><button>Cambiar ›</button></div></section>
<section class="settings-max-card"><h3>Seguridad en planes</h3>${toggles(['Compartir check-in con contacto de confianza','Avisar cuando llegue al punto de encuentro','Ocultar ubicación exacta hasta confirmar asistencia','Filtro antiacoso y lenguaje ofensivo'])}</section>
<section class="settings-max-card danger"><h3>Datos y cuenta</h3><button>Descargar mis datos</button><button>Gestionar usuarios bloqueados</button><button>Eliminar cuenta</button></section>`},
'Guía CONECTA':{title:'Guía CONECTA',subtitle:'Todo lo necesario para aprovechar la app',html:`
${guide('1. Descubre','Explora planes por categoría, momento, distancia y compatibilidad. Guarda los que te interesen para decidir después.')}
${guide('2. Únete a un plan','Entra en la ficha, revisa lugar, hora, plazas, asistentes y organizador. Pulsa “Unirme al plan” para confirmar.')}
${guide('3. Conoce gente compatible','CONECTA usa intereses, disponibilidad y preferencias sociales para mostrarte personas y planes afines.')}
${guide('4. Crea tu propio plan','Pulsa +, completa actividad, fecha, hora, lugar, plazas, privacidad y detalles. Podrás editarlo después.')}
${guide('5. Usa el chat','Cada plan puede tener conversación propia. También puedes hablar con conexiones y grupos recurrentes.')}
${guide('6. Seguridad','Verifica tu perfil, evita compartir datos sensibles, usa bloqueo/denuncia cuando haga falta y confirma siempre el lugar del encuentro.')}
${guide('7. Perfil y reputación','Completa biografía, intereses, fotos, idiomas y verificaciones. Tus valoraciones ayudan a generar confianza.')}`},
'Normas de la comunidad':{title:'Normas de la comunidad',subtitle:'Un lugar seguro, real y respetuoso',html:`
${rule('Respeto primero','No se permiten amenazas, acoso, discriminación, humillaciones ni contenido sexual no solicitado.')}${rule('Personas reales','No suplantes identidades ni publiques información falsa para engañar a otros usuarios.')}${rule('Planes seguros','No publiques domicilios privados como punto de encuentro inicial. Usa lugares públicos y adecuados.')}${rule('Nada de spam','No uses CONECTA para publicidad masiva, estafas, captación fraudulenta o enlaces maliciosos.')}${rule('Privacidad','No compartas fotos, mensajes, teléfonos o información privada de otra persona sin permiso.')}${rule('Asistencia responsable','Si confirmas un plan y no puedes ir, avisa. La reincidencia puede afectar a tu reputación.')}${rule('Denuncia y bloqueo','Puedes bloquear o denunciar conductas que incumplan estas normas. Las incidencias graves deben revisarse con prioridad.')}`},
'Centro de ayuda':{title:'Centro de ayuda',subtitle:'Soporte, preguntas y resolución de problemas',html:`
<section class="settings-max-card"><h3>¿Qué necesitas?</h3><input class="help-search" placeholder="Buscar ayuda: cuenta, planes, chat, pagos…"><div class="help-grid"><button>Cuenta y acceso</button><button>Planes y asistencia</button><button>Chat y grupos</button><button>Privacidad</button><button>Premium</button><button>Problemas técnicos</button></div></section>
<section class="settings-max-card"><h3>Preguntas frecuentes</h3>${faq('¿Cómo cancelo mi asistencia?','Abre el plan confirmado, entra en asistencia y cambia tu estado. Si el plan está próximo, avisa también en el chat.')}${faq('¿Cómo bloqueo a alguien?','Desde su perfil abre Seguridad y selecciona Bloquear. Esa persona dejará de poder contactarte.')}${faq('¿Cómo cambio mis preferencias?','En Ajustes puedes modificar apariencia, notificaciones, accesibilidad y preferencias de experiencia.')}${faq('¿Qué incluye Premium?','Mayor visibilidad, recomendaciones avanzadas, ventajas exclusivas y acceso prioritario a determinadas experiencias.')}</section>
<section class="settings-max-card support"><h3>Contacto</h3><p>Si no encuentras solución, envía una incidencia con descripción, dispositivo y capturas.</p><button data-support>Crear solicitud de soporte</button></section>`},
'Invitar amigos':{title:'Invitar amigos',subtitle:'CONECTA es mejor con tu gente',html:`<section class="invite-hero"><h3>Invita a tus amigos</h3><p>Comparte CONECTA para organizar planes, crear grupos y descubrir experiencias juntos.</p><button data-share>Compartir invitación</button></section><section class="settings-max-card"><h3>Tu invitación</h3><div class="invite-code"><b>CONECTA-FERNANDO</b><button data-copy>Copiar</button></div><p class="muted">Comparte este código con quien quieras invitar.</p></section>`},
'Sobre CONECTA':{title:'Sobre CONECTA',subtitle:'Planes reales. Gente compatible.',html:`<section class="about-hero"><span class="about-logo">✦</span><h2>CONECTA</h2><p>Una aplicación social diseñada para que conocer gente y hacer planes reales sea más sencillo, seguro y natural.</p></section><section class="settings-max-card"><h3>Nuestra idea</h3><p>Menos tiempo mirando una pantalla y más tiempo viviendo experiencias. CONECTA une intereses, disponibilidad, proximidad y confianza para ayudarte a pasar de “me apetece hacer algo” a tener un plan real.</p></section><section class="settings-max-card"><h3>Información</h3><div class="option-line"><span><b>Versión</b><small>Premium Max</small></span><span>1.0</span></div><div class="option-line"><span><b>Estado</b><small>Experiencia principal</small></span><span>Activa</span></div><button>Condiciones de uso</button><button>Política de privacidad</button><button>Licencias de terceros</button></section>`}
};

function toggles(labels:string[]){return labels.map((x,i)=>`<label class="switch-row"><span><b>${x}</b><small>${i%2?'Configurable en cualquier momento':'Recomendado por CONECTA'}</small></span><input type="checkbox" ${i<2?'checked':''}></label>`).join('')}
function guide(t:string,p:string){return `<section class="settings-max-card guide"><h3>${t}</h3><p>${p}</p></section>`}
function rule(t:string,p:string){return `<section class="settings-max-card rule"><h3>${t}</h3><p>${p}</p></section>`}
function faq(q:string,a:string){return `<details><summary>${q}</summary><p>${a}</p></details>`}

function openSection(name:SettingSection){
  document.querySelector('.settings-max-overlay')?.remove();
  const s=sectionCopy[name]; const wrap=document.createElement('div');wrap.className='settings-max-overlay';
  wrap.innerHTML=`<div class="settings-max-sheet"><header><button class="settings-max-back" aria-label="Volver">‹</button><div><h1>${s.title}</h1><p>${s.subtitle}</p></div></header><div class="settings-max-content">${s.html}</div></div>`;
  document.body.appendChild(wrap); document.body.classList.add('settings-modal-open');
  wrap.querySelector('.settings-max-back')?.addEventListener('click',()=>{wrap.remove();document.body.classList.remove('settings-modal-open')});
  wrap.addEventListener('click',e=>{if(e.target===wrap){wrap.remove();document.body.classList.remove('settings-modal-open')}});
  wireSection(wrap,name);
}

function wireSection(root:HTMLElement,name:SettingSection){
 if(name==='Ajustes'){
  let p=loadPrefs(); const set=(k:keyof ThemePrefs,v:any)=>{p={...p,[k]:v};applyPrefs(p)};
  root.querySelectorAll<HTMLInputElement>('[data-pref]').forEach(el=>{const k=el.dataset.pref as keyof ThemePrefs; if(el.type==='checkbox') el.checked=Boolean(p[k]); else el.value=String(p[k]); el.addEventListener('input',()=>set(k,el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value))});
  root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(b=>b.addEventListener('click',()=>{const presets:any={lavender:defaults,clean:{...defaults,bg:'#ffffff',accent:'#6847f5',text:'#17213e'},night:{...defaults,bg:'#171329',accent:'#9b7cff',text:'#f7f5ff'},ocean:{...defaults,bg:'#eef7ff',accent:'#3478f6',text:'#14233b'}};p=presets[b.dataset.preset||'lavender'];applyPrefs(p);root.querySelectorAll<HTMLInputElement>('[data-pref]').forEach(el=>{const k=el.dataset.pref as keyof ThemePrefs;if(el.type==='checkbox')el.checked=Boolean(p[k]);else el.value=String(p[k])})}));
  root.querySelector('.settings-reset')?.addEventListener('click',()=>{localStorage.removeItem(KEY);applyPrefs(defaults);openSection('Ajustes')});
 }
 root.querySelector('[data-share]')?.addEventListener('click',async()=>{const data={title:'CONECTA',text:'Únete a CONECTA y hacemos planes juntos. Código: CONECTA-FERNANDO'};try{if(navigator.share)await navigator.share(data);else await navigator.clipboard.writeText(data.text)}catch{}});
 root.querySelector('[data-copy]')?.addEventListener('click',async(e)=>{await navigator.clipboard.writeText('CONECTA-FERNANDO');(e.currentTarget as HTMLButtonElement).textContent='Copiado ✓'});
 root.querySelector('[data-support]')?.addEventListener('click',()=>{window.location.href='mailto:soporte@conecta.app?subject=Soporte%20CONECTA'});
}

function enhance(){
 const page=document.querySelector('.settings-page'); if(!page)return;
 page.querySelectorAll<HTMLButtonElement>('.settings-list > button').forEach(btn=>{
   if(btn.dataset.enhanced)return; const title=btn.querySelector('strong')?.textContent?.trim() as SettingSection|undefined;
   if(title&&sectionCopy[title]){btn.dataset.enhanced='1';btn.addEventListener('click',()=>openSection(title));}
 });
}
const observer=new MutationObserver(enhance);observer.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
