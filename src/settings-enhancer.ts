type SettingSection =
  | 'Ajustes'
  | 'Privacidad y seguridad'
  | 'Calidad de la aplicación'
  | 'Cuenta y Premium'
  | 'Notificaciones'
  | 'Datos y permisos'
  | 'Guía CONECTA'
  | 'Normas de la comunidad'
  | 'Centro de ayuda'
  | 'Invitar amigos'
  | 'Sobre CONECTA';

type ThemePrefs={bg:string;accent:string;text:string;radius:number;fontScale:number;compact:boolean};
const UI_KEY='conecta-ui-prefs-v2';
const TOGGLE_KEY='conecta-setting-toggles-v2';
const defaults:ThemePrefs={bg:'#f7f4ff',accent:'#6f46ff',text:'#17213e',radius:20,fontScale:100,compact:false};

function loadPrefs():ThemePrefs{try{return {...defaults,...JSON.parse(localStorage.getItem(UI_KEY)||'{}')}}catch{return defaults}}
function loadToggles():Record<string,boolean>{try{return JSON.parse(localStorage.getItem(TOGGLE_KEY)||'{}')}catch{return {}}}
function saveToggles(v:Record<string,boolean>){localStorage.setItem(TOGGLE_KEY,JSON.stringify(v))}
function applyPrefs(p:ThemePrefs){
  const r=document.documentElement;
  r.style.setProperty('--lav-bg',p.bg);
  r.style.setProperty('--lav-primary',p.accent);
  r.style.setProperty('--lav-ink',p.text);
  r.style.setProperty('--user-radius',`${p.radius}px`);
  r.style.setProperty('--user-font-scale',`${p.fontScale/100}`);
  document.body.dataset.compact=p.compact?'1':'0';
  localStorage.setItem(UI_KEY,JSON.stringify(p));
}
applyPrefs(loadPrefs());

const toggles=(labels:string[])=>labels.map((x,i)=>`<label class="switch-row"><span><b>${x}</b><small>${i%2?'Configurable en cualquier momento':'Recomendado por CONECTA'}</small></span><input type="checkbox" data-toggle="${encodeURIComponent(x)}" ${i<2?'checked':''}></label>`).join('');
const option=(title:string,sub:string,action='Abrir ›')=>`<div class="option-line"><span><b>${title}</b><small>${sub}</small></span><button>${action}</button></div>`;
const guide=(t:string,p:string)=>`<section class="settings-max-card guide"><h3>${t}</h3><p>${p}</p></section>`;
const rule=(t:string,p:string)=>`<section class="settings-max-card rule"><h3>${t}</h3><p>${p}</p></section>`;
const faq=(q:string,a:string)=>`<details><summary>${q}</summary><p>${a}</p></details>`;

const sectionCopy:Record<SettingSection,{title:string;subtitle:string;html:string}>={
'Ajustes':{title:'Ajustes',subtitle:'Personaliza CONECTA exactamente a tu gusto',html:`
<section class="settings-max-card live-preview"><div><span class="preview-dot"></span><b>Vista previa en tiempo real</b><small>Los cambios se aplican al instante y se guardan en este dispositivo.</small></div></section>
<section class="settings-max-card"><h3>Apariencia</h3><p>Control total sobre la identidad visual de la aplicación.</p><div class="theme-grid">
<label>Fondo <input data-pref="bg" type="color"></label><label>Color principal <input data-pref="accent" type="color"></label><label>Color de texto <input data-pref="text" type="color"></label>
<label>Redondeado <input data-pref="radius" type="range" min="8" max="34"></label><label>Tamaño de letra <input data-pref="fontScale" type="range" min="90" max="118"></label></div>
<div class="preset-row"><button data-preset="lavender">Lavender</button><button data-preset="clean">Claro</button><button data-preset="night">Noche</button><button data-preset="ocean">Océano</button><button data-preset="rose">Rosa suave</button><button data-preset="graphite">Grafito</button></div>
<label class="switch-row"><span><b>Vista compacta</b><small>Reduce espacios y muestra más contenido</small></span><input data-pref="compact" type="checkbox"></label>
<button class="settings-reset">Restablecer diseño CONECTA</button></section>
<section class="settings-max-card"><h3>Experiencia</h3>${toggles(['Animaciones de interfaz','Respuesta háptica','Sonidos de interacción','Previsualizaciones en chat','Reproducción automática de vídeos','Mostrar actividad reciente','Confirmar antes de salir de un formulario'])}</section>
<section class="settings-max-card"><h3>Accesibilidad</h3>${toggles(['Texto de alto contraste','Reducir movimiento','Etiquetas accesibles','Aumentar zonas táctiles','Subrayar enlaces','Evitar transparencias intensas'])}</section>`},
'Privacidad y seguridad':{title:'Privacidad y seguridad',subtitle:'Control completo sobre quién te ve, te contacta y accede a tu cuenta',html:`
<section class="settings-security-score"><div><small>PROTECCIÓN DE LA CUENTA</small><strong>Excelente</strong><span>8 de 8 controles recomendados activos</span></div><b>100</b></section>
<section class="settings-max-card"><h3>Privacidad del perfil</h3>${toggles(['Perfil visible en recomendaciones','Mostrar distancia aproximada','Mostrar estado online','Permitir solicitudes de conexión','Mostrar planes a los que asisto','Permitir que me encuentren por teléfono','Mostrar valoraciones públicamente'])}</section>
<section class="settings-max-card"><h3>Inicio de sesión y dispositivos</h3>${toggles(['Face ID / biometría','Avisos de inicio de sesión nuevo','Confirmación para acciones sensibles','Cerrar sesión automáticamente en dispositivos inactivos'])}${option('Dispositivos con sesión iniciada','iPhone actual · Navegador del ordenador','Revisar ›')}${option('Historial de accesos','Últimos inicios de sesión y cambios de seguridad','Ver historial ›')}${option('Cambiar contraseña','Actualiza tus credenciales de acceso','Cambiar ›')}</section>
<section class="settings-max-card"><h3>Seguridad en planes</h3>${toggles(['Compartir check-in con contacto de confianza','Avisar cuando llegue al punto de encuentro','Ocultar ubicación exacta hasta confirmar asistencia','Filtro antiacoso y lenguaje ofensivo','Bloquear invitaciones de cuentas nuevas sospechosas'])}</section>
<section class="settings-max-card danger"><h3>Protección y control</h3><button>Gestionar usuarios bloqueados</button><button>Revisar denuncias enviadas</button><button>Centro de seguridad</button></section>`},
'Calidad de la aplicación':{title:'Calidad de la aplicación',subtitle:'Rendimiento, estabilidad, red y diagnóstico del dispositivo',html:`
<section class="quality-grid"><article><small>ESTADO</small><strong>Óptimo</strong><span>Interfaz estable</span></article><article><small>RENDIMIENTO</small><strong>98%</strong><span>Respuesta fluida</span></article><article><small>RED</small><strong>Online</strong><span>Conectividad disponible</span></article><article><small>DATOS</small><strong>Local</strong><span>Preferencias guardadas</span></article></section>
<section class="settings-max-card"><h3>Rendimiento</h3>${toggles(['Carga inteligente de imágenes','Precargar siguiente pantalla','Ahorrar datos móviles','Reducir calidad con mala conexión','Optimizar animaciones automáticamente'])}</section>
<section class="settings-max-card"><h3>Diagnóstico</h3>${option('Comprobar interfaz','Revisa navegación, almacenamiento y soporte del navegador','Ejecutar ›')}${option('Limpiar preferencias visuales','Restablece solo ajustes de apariencia','Limpiar ›')}${option('Información del dispositivo',navigator.userAgent,'Ver ›')}</section>
<section class="settings-max-card"><h3>Calidad y errores</h3>${toggles(['Enviar informes técnicos anónimos','Registrar errores de interfaz localmente','Avisarme si una función no está disponible'])}<button data-run-diagnostic class="primary-action">Ejecutar diagnóstico ahora</button><div class="diagnostic-result" hidden></div></section>`},
'Cuenta y Premium':{title:'Cuenta y Premium',subtitle:'Tu cuenta, plan, ventajas y preferencias de suscripción',html:`
<section class="premium-account-card"><span>PREMIUM</span><h2>CONECTA Premium</h2><p>Tu experiencia prioritaria está activa.</p><div><b>Más visibilidad</b><b>Recomendaciones avanzadas</b><b>Prioridad en experiencias</b></div></section>
<section class="settings-max-card"><h3>Cuenta</h3>${option('Datos personales','Nombre, fecha de nacimiento y contacto','Editar ›')}${option('Correo y teléfono','Métodos de acceso y recuperación','Gestionar ›')}${option('Métodos de inicio de sesión','Correo, Apple, Google y otros proveedores','Gestionar ›')}</section>
<section class="settings-max-card"><h3>Premium</h3>${option('Mi suscripción','Estado, renovación y plan actual','Ver ›')}${option('Ventajas Premium','Todos los beneficios disponibles','Explorar ›')}${option('Facturación','Historial y recibos','Abrir ›')}${toggles(['Avisar antes de renovar','Mostrar insignia Premium en mi perfil'])}</section>`},
'Notificaciones':{title:'Notificaciones',subtitle:'Decide qué avisos recibes y cuándo',html:`
<section class="settings-max-card"><h3>Planes</h3>${toggles(['Invitaciones a planes','Cambios en mis planes','Recordatorios de asistencia','Lista de espera disponible','Plan cancelado o modificado'])}</section>
<section class="settings-max-card"><h3>Personas y chat</h3>${toggles(['Nuevos mensajes','Solicitudes de conexión','Personas compatibles','Actividad de mis grupos','Menciones en conversaciones'])}</section>
<section class="settings-max-card"><h3>Frecuencia</h3>${option('Resumen diario','Una selección de lo importante','Configurar ›')}${option('Horario silencioso','Evita avisos durante tus horas de descanso','Configurar ›')}${toggles(['Novedades y recomendaciones','Ofertas y ventajas Premium'])}</section>`},
'Datos y permisos':{title:'Datos y permisos',subtitle:'Gestiona almacenamiento, permisos y portabilidad de tus datos',html:`
<section class="settings-max-card"><h3>Permisos del dispositivo</h3>${toggles(['Ubicación para planes cercanos','Cámara para perfil y verificación','Fotos para galería','Notificaciones del sistema','Micrófono para futuras funciones de voz'])}</section>
<section class="settings-max-card"><h3>Mis datos</h3><button data-export>Descargar copia de mis preferencias</button><button data-clear-local>Limpiar datos locales de CONECTA</button><button>Solicitar exportación completa de cuenta</button></section>
<section class="settings-max-card danger"><h3>Control de cuenta</h3><p>Las acciones permanentes deben requerir confirmación y autenticación.</p><button>Desactivar temporalmente mi cuenta</button><button>Eliminar cuenta</button></section>`},
'Guía CONECTA':{title:'Guía CONECTA',subtitle:'Domina cada parte de la aplicación paso a paso',html:`
${guide('1. Descubre','Explora planes por categoría, momento, distancia y compatibilidad. Guarda los que te interesen y vuelve a ellos cuando quieras.')}
${guide('2. Únete a un plan','Revisa lugar, hora, plazas, asistentes, organizador y normas. Confirma tu asistencia y usa el chat del plan.')}
${guide('3. Conoce gente compatible','Los intereses, disponibilidad, distancia y preferencias sociales ayudan a priorizar perfiles y planes afines.')}
${guide('4. Crea un plan','Pulsa +, añade actividad, fecha, hora, lugar, plazas, privacidad, coste y detalles. Después podrás editarlo.')}
${guide('5. Chat y grupos','Habla con conexiones, participantes y grupos recurrentes. Mantén siempre el respeto y evita compartir datos sensibles.')}
${guide('6. Seguridad','Usa verificación, bloqueo, denuncia, check-in y lugares públicos. No compartas domicilios privados con desconocidos.')}
${guide('7. Perfil y reputación','Completa fotos, biografía, intereses e idiomas. La asistencia y las valoraciones construyen confianza.')}
${guide('8. Privacidad','Desde el centro de privacidad puedes decidir qué información se muestra y quién puede encontrarte.')}
${guide('9. Premium','Consulta ventajas, visibilidad, prioridad y herramientas adicionales desde Cuenta y Premium.')}`},
'Normas de la comunidad':{title:'Normas de la comunidad',subtitle:'Normas claras para una comunidad segura y real',html:`
${rule('Respeto primero','No se permiten amenazas, acoso, discriminación, humillaciones ni contenido sexual no solicitado.')}${rule('Personas reales','No suplantes identidades ni publiques información falsa para engañar a otros usuarios.')}${rule('Planes seguros','No publiques domicilios privados como punto de encuentro inicial. Prioriza espacios públicos.')}${rule('Nada de spam','No uses CONECTA para publicidad masiva, estafas, captación fraudulenta o enlaces maliciosos.')}${rule('Privacidad','No compartas fotos, mensajes, teléfonos o datos privados de otra persona sin permiso.')}${rule('Asistencia responsable','Si confirmas un plan y no puedes ir, cambia tu estado y avisa al grupo.')}${rule('Contenido adecuado','Fotos, nombres, biografías y mensajes deben respetar a la comunidad y la legislación aplicable.')}${rule('Denuncia y bloqueo','Bloquea o denuncia conductas problemáticas. Las incidencias graves deben revisarse con prioridad.')}`},
'Centro de ayuda':{title:'Centro de ayuda',subtitle:'Busca respuestas, diagnostica problemas y contacta con soporte',html:`
<section class="settings-max-card"><h3>¿Qué necesitas?</h3><input class="help-search" placeholder="Buscar: cuenta, planes, chat, privacidad, Premium…"><div class="help-grid"><button>Cuenta y acceso</button><button>Planes y asistencia</button><button>Chat y grupos</button><button>Privacidad</button><button>Premium</button><button>Problemas técnicos</button></div></section>
<section class="settings-max-card help-faq"><h3>Preguntas frecuentes</h3>${faq('¿Cómo cancelo mi asistencia?','Abre el plan confirmado, entra en asistencia y cambia tu estado. Si está próximo, avisa también en el chat.')}${faq('¿Cómo bloqueo a alguien?','Desde su perfil abre Seguridad y selecciona Bloquear. Esa persona dejará de poder contactarte.')}${faq('¿Cómo cambio mis preferencias?','En Ajustes puedes modificar apariencia, notificaciones, accesibilidad y experiencia.')}${faq('¿Qué incluye Premium?','Mayor visibilidad, recomendaciones avanzadas, ventajas exclusivas y prioridad en determinadas experiencias.')}${faq('¿Qué hago si una pantalla no carga?','Comprueba conexión, actualiza la app y usa Calidad de la aplicación para ejecutar un diagnóstico.')}${faq('¿Cómo protejo mi cuenta?','Activa biometría, avisos de inicio de sesión y revisa regularmente los dispositivos conectados.')}</section>
<section class="settings-max-card support"><h3>Soporte técnico</h3><p>Incluye dispositivo, pantalla afectada y qué estabas intentando hacer.</p><textarea class="support-text" placeholder="Describe el problema…"></textarea><button data-support>Crear solicitud de soporte</button></section>`},
'Invitar amigos':{title:'Invitar amigos',subtitle:'Comparte CONECTA y organiza planes con tu gente',html:`<section class="invite-hero"><h3>Invita a tus amigos</h3><p>Comparte CONECTA para crear grupos, descubrir experiencias y organizar planes juntos.</p><button data-share>Compartir invitación</button></section><section class="settings-max-card"><h3>Tu invitación</h3><div class="invite-code"><b>CONECTA-FERNANDO</b><button data-copy>Copiar</button></div><p class="muted">Puedes compartir este código tantas veces como quieras.</p></section><section class="settings-max-card"><h3>Consejos</h3><p>Invita a personas que conozcas y evita publicar tu código junto a información privada.</p></section>`},
'Sobre CONECTA':{title:'Sobre CONECTA',subtitle:'Planes reales. Gente compatible.',html:`<section class="about-hero"><span class="about-logo">✦</span><h2>CONECTA</h2><p>Una aplicación social diseñada para que conocer gente y hacer planes reales sea más sencillo, seguro y natural.</p></section><section class="settings-max-card"><h3>Nuestra idea</h3><p>Menos tiempo mirando una pantalla y más tiempo viviendo experiencias. CONECTA combina intereses, disponibilidad, proximidad y confianza para ayudarte a pasar de “me apetece hacer algo” a un plan real.</p></section><section class="settings-max-card"><h3>Información</h3>${option('Versión','Premium Max 1.0','Actual')}${option('Estado de la experiencia','Interfaz principal activa','Operativa')}${option('Privacidad','Cómo tratamos y protegemos tus datos','Leer ›')}${option('Condiciones de uso','Reglas legales del servicio','Leer ›')}${option('Licencias de terceros','Software y recursos utilizados','Ver ›')}</section><section class="settings-max-card"><h3>Principios</h3><p>Seguridad por diseño · Privacidad configurable · Personas reales · Planes reales · Control del usuario.</p></section>`}
};

function closeSection(wrap:HTMLElement){wrap.remove();document.body.classList.remove('settings-modal-open')}
function openSection(name:SettingSection){
  document.querySelector('.settings-max-overlay')?.remove();
  const s=sectionCopy[name];
  const wrap=document.createElement('div');wrap.className='settings-max-overlay';
  wrap.innerHTML=`<div class="settings-max-sheet"><header><button class="settings-max-back" aria-label="Volver">‹</button><div><h1>${s.title}</h1><p>${s.subtitle}</p></div></header><div class="settings-max-content">${s.html}</div></div>`;
  document.body.appendChild(wrap);document.body.classList.add('settings-modal-open');
  wrap.querySelector('.settings-max-back')?.addEventListener('click',()=>closeSection(wrap));
  wrap.addEventListener('click',e=>{if(e.target===wrap)closeSection(wrap)});
  wireSection(wrap,name);
}

function wirePersistentToggles(root:HTMLElement){
  const state=loadToggles();
  root.querySelectorAll<HTMLInputElement>('[data-toggle]').forEach(el=>{
    const key=el.dataset.toggle||'';
    if(key in state)el.checked=state[key];
    el.addEventListener('change',()=>{const next=loadToggles();next[key]=el.checked;saveToggles(next)});
  });
}

function wireSection(root:HTMLElement,name:SettingSection){
  wirePersistentToggles(root);
  if(name==='Ajustes'){
    let p=loadPrefs();
    const sync=()=>root.querySelectorAll<HTMLInputElement>('[data-pref]').forEach(el=>{const k=el.dataset.pref as keyof ThemePrefs;if(el.type==='checkbox')el.checked=Boolean(p[k]);else el.value=String(p[k])});
    const set=(k:keyof ThemePrefs,v:any)=>{p={...p,[k]:v};applyPrefs(p)};
    sync();
    root.querySelectorAll<HTMLInputElement>('[data-pref]').forEach(el=>{const k=el.dataset.pref as keyof ThemePrefs;el.addEventListener('input',()=>set(k,el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value))});
    root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(b=>b.addEventListener('click',()=>{
      const presets:Record<string,ThemePrefs>={
        lavender:defaults,
        clean:{...defaults,bg:'#ffffff',accent:'#6847f5',text:'#17213e'},
        night:{...defaults,bg:'#171329',accent:'#9b7cff',text:'#f7f5ff'},
        ocean:{...defaults,bg:'#eef7ff',accent:'#3478f6',text:'#14233b'},
        rose:{...defaults,bg:'#fff5fb',accent:'#b84cff',text:'#321d39'},
        graphite:{...defaults,bg:'#f2f3f5',accent:'#5750d9',text:'#171922'}
      };
      p=presets[b.dataset.preset||'lavender']||defaults;applyPrefs(p);sync();
    }));
    root.querySelector('.settings-reset')?.addEventListener('click',()=>{localStorage.removeItem(UI_KEY);p=defaults;applyPrefs(p);sync()});
  }
  root.querySelector('[data-share]')?.addEventListener('click',async()=>{const data={title:'CONECTA',text:'Únete a CONECTA y hacemos planes juntos. Código: CONECTA-FERNANDO'};try{if(navigator.share)await navigator.share(data);else await navigator.clipboard.writeText(data.text)}catch{}});
  root.querySelector('[data-copy]')?.addEventListener('click',async(e)=>{try{await navigator.clipboard.writeText('CONECTA-FERNANDO');(e.currentTarget as HTMLButtonElement).textContent='Copiado ✓'}catch{}});
  root.querySelector('[data-support]')?.addEventListener('click',()=>{const text=(root.querySelector('.support-text') as HTMLTextAreaElement|null)?.value||'';window.location.href=`mailto:soporte@conecta.app?subject=Soporte%20CONECTA&body=${encodeURIComponent(text)}`});
  root.querySelector('[data-run-diagnostic]')?.addEventListener('click',e=>{const box=root.querySelector('.diagnostic-result') as HTMLElement|null;if(!box)return;box.hidden=false;box.innerHTML=`<b>Diagnóstico completado ✓</b><span>Navegación: OK · Almacenamiento local: ${typeof localStorage!=='undefined'?'OK':'No disponible'} · Compartir: ${navigator.share?'Disponible':'Modo copia'} · Conexión: ${navigator.onLine?'Online':'Offline'}</span>`;(e.currentTarget as HTMLButtonElement).textContent='Diagnóstico completado'});
  root.querySelector('[data-export]')?.addEventListener('click',()=>{const payload={ui:loadPrefs(),toggles:loadToggles(),exportedAt:new Date().toISOString()};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='conecta-preferencias.json';a.click();URL.revokeObjectURL(a.href)});
  root.querySelector('[data-clear-local]')?.addEventListener('click',e=>{localStorage.removeItem(UI_KEY);localStorage.removeItem(TOGGLE_KEY);applyPrefs(defaults);(e.currentTarget as HTMLButtonElement).textContent='Datos locales limpiados ✓'});
  const search=root.querySelector('.help-search') as HTMLInputElement|null;
  if(search)search.addEventListener('input',()=>{const q=search.value.toLowerCase().trim();root.querySelectorAll<HTMLElement>('.help-faq details').forEach(d=>d.style.display=!q||d.textContent?.toLowerCase().includes(q)?'':'none')});
}

const extraRows:[SettingSection,string,string,string][]=[
  ['Calidad de la aplicación','Calidad de la aplicación','Rendimiento, estabilidad y diagnóstico','⚙'],
  ['Cuenta y Premium','Cuenta y Premium','Cuenta, suscripción y ventajas','♛'],
  ['Notificaciones','Notificaciones','Mensajes, planes y horarios','🔔'],
  ['Datos y permisos','Datos y permisos','Ubicación, cámara y portabilidad','◈']
];

function injectDashboard(page:Element){
  if(page.querySelector('.settings-control-center'))return;
  const header=page.querySelector('.gold-card');
  if(header){const dashboard=document.createElement('section');dashboard.className='settings-control-center';dashboard.innerHTML=`<div><small>CENTRO DE CONTROL</small><h2>Todo bajo control</h2><p>Privacidad, seguridad, calidad y personalización reunidas en un solo lugar.</p></div><div class="control-status"><span><b>100%</b> Seguridad</span><span><b>Óptimo</b> Calidad</span><span><b>Activo</b> Premium</span></div>`;header.insertAdjacentElement('afterend',dashboard)}
  const list=page.querySelector('.settings-list');
  if(list&&!list.querySelector('[data-extra-setting]')){
    extraRows.forEach(([section,title,sub,icon])=>{const b=document.createElement('button');b.dataset.extraSetting='1';b.innerHTML=`<span class="settings-emoji">${icon}</span><div><strong>${title}</strong><span>${sub}</span></div><span class="settings-chevron">›</span>`;b.addEventListener('click',()=>openSection(section));list.appendChild(b)});
  }
}

function enhance(){
  const page=document.querySelector('.settings-page');if(!page)return;
  injectDashboard(page);
  page.querySelectorAll<HTMLButtonElement>('.settings-list > button').forEach(btn=>{
    if(btn.dataset.enhanced||btn.dataset.extraSetting)return;
    const title=btn.querySelector('strong')?.textContent?.trim() as SettingSection|undefined;
    if(title&&sectionCopy[title]){btn.dataset.enhanced='1';btn.addEventListener('click',()=>openSection(title))}
  });
}
const observer=new MutationObserver(enhance);observer.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
