import {test,expect} from '@playwright/test';
import {backend,nav} from './helpers.js';

// Checks actual geometry, including content hidden by overflow on the document.
// Horizontal carousels are intentional; document-level horizontal scrolling is not.
async function measure(page,label){
  await page.mouse.move(0,0);
  return page.evaluate(label=>{
    const issues=[],vw=document.documentElement.clientWidth;
    const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    const identify=el=>el.tagName.toLowerCase()+'.'+String(el.className||'').trim().split(/\s+/).join('.')+' '+(el.textContent||'').trim().slice(0,65);
    const carousel=el=>{for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);if(/auto|scroll/.test(s.overflowX)&&p.scrollWidth>p.clientWidth+2)return true;}return false;};
    for(const el of document.querySelectorAll('.content :is(h1,h2,h3,p,button,input,select,textarea,article,section,header,[class$="-head"],[class$="-header"]),.topbar,.sidebar,.bottom-nav')){
      if(!visible(el)||el.closest('.leaflet-container')||carousel(el))continue;
      const r=el.getBoundingClientRect();
      if(r.left<-2||r.right>vw+2)issues.push({kind:'viewport-overflow',element:identify(el),left:Math.round(r.left),right:Math.round(r.right),vw});
      const s=getComputedStyle(el);
      if(el.matches('h1,h2,h3,button')&&s.textOverflow!=='ellipsis'&&!el.querySelector('img')&&el.clientWidth>0&&el.scrollWidth>el.clientWidth+3&&!/auto|scroll/.test(s.overflowX))issues.push({kind:'clipped-text',element:identify(el),client:el.clientWidth,scroll:el.scrollWidth});
    }
    for(const selector of ['.home-target-head','.explore-v2-title','.cp-head','.settings-toggle-row','.settings-frequency-option','.profile-heading','.profile-media-head','.chat-thread-head','.topbar']){
      for(const row of document.querySelectorAll(selector)){
        if(!visible(row))continue;
        const children=[...row.children].filter(visible);
        for(let i=0;i<children.length;i++)for(let j=i+1;j<children.length;j++){
          const a=children[i].getBoundingClientRect(),b=children[j].getBoundingClientRect();
          if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2)issues.push({kind:'sibling-overlap',element:selector,a:identify(children[i]),b:identify(children[j])});
        }
      }
    }
    const explore=document.querySelector('.explore-social-v2'),content=document.querySelector('.content');
    if(explore&&content&&explore.getBoundingClientRect().left-content.getBoundingClientRect().left>70)issues.push({kind:'double-sidebar-offset',element:'Explora'});
    return {label,issues};
  },label);
}
for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768],[1440,900]]){
 test('layout audit '+width+'x'+height,async({page},info)=>{
  test.skip(info.project.name!=='chromium-desktop','Explicit responsive matrix already includes mobile');
  test.setTimeout(180000);await page.setViewportSize({width,height});
  await backend(page);await page.goto('/');await expect(page.locator('.app-shell')).toBeVisible();
  await page.addStyleTag({content:'*{content-visibility:visible!important;animation:none!important;transition:none!important;scroll-behavior:auto!important}'});
  const reports=[];
  const check=async label=>{await page.evaluate(()=>window.scrollTo(0,0));await page.evaluate(()=>new Promise(requestAnimationFrame));reports.push(await measure(page,label));};
  const row=title=>page.locator('.settings-row').filter({has:page.getByText(title,{exact:true})});
  const back=()=>page.locator('.settings-back:not(.placeholder)').click();
  await check('Inicio');
  await page.getByRole('button',{name:'Explorar planes',exact:true}).click();await check('Planes');
  await page.getByRole('button',{name:'Ver plan',exact:false}).first().click();await check('Detalle de plan');
  await nav(page,'Inicio');
  for(const mode of ['Ahora mismo','Esta tarde','Esta noche','Este finde']){
    await page.locator('.quick-grid button').filter({hasText:mode}).click();await check(mode);await nav(page,'Inicio');
  }
  for(const [heading,label] of [['Explora por categorías','Categorías'],['Escapadas y eventos','Escapadas'],['Personas compatibles','Personas']]){
    await page.locator('.home-target-section').filter({has:page.getByRole('heading',{name:heading,exact:true})}).locator('.home-target-head button').click();await check(label);
    if(label==='Categorías'){await page.locator('.home-browse-categories button').first().click();await check('Categoría / planes');}
    await nav(page,'Inicio');
  }
  await page.getByRole('button',{name:'Ver mapa completo',exact:false}).click();await check('Mapa');await nav(page,'Inicio');
  await nav(page,'Explora');await check('Explora');
  await page.goto('/?shortcut=create-plan');await expect(page.locator('.cp-form')).toBeVisible();await check('Crear plan');
  await nav(page,'Chat');await check('Chat / lista');
  await page.locator('.chat-list>button').first().click();await check('Chat / conversación');
  await nav(page,'Perfil');await check('Perfil');
  await page.getByRole('button',{name:'Editar perfil',exact:true}).click();await check('Perfil / editor');
  for(const title of ['Fotos','Planes','Conexiones','Valoraciones']){await page.locator('.profile-tabs button').filter({hasText:title}).click();await check('Perfil / '+title);}
  await page.getByRole('button',{name:'Abrir notificaciones',exact:false}).click();await check('Notificaciones');
  await nav(page,'Perfil');await page.getByRole('button',{name:'Más opciones',exact:true}).click();await check('Ajustes');
  for(const title of ['Mi cuenta','Seguridad','Privacidad','Notificaciones','Apariencia','Idioma','Centro de ayuda','Sobre CONECTA']){
    await row(title).click();await check('Ajustes / '+title);
    if(title==='Mi cuenta'){await page.getByRole('button',{name:'Editar datos',exact:true}).click();await check('Cuenta / formulario');}
    if(title==='Seguridad'){
      await row('Contraseña').click();await check('Contraseña');await back();
      for(const name of ['Verificación por selfie','Contacto de emergencia']){await row(name).click();await check(name);await row(name).click();}
      for(const name of ['Verificación en dos pasos','Verificación de email','Verificación de teléfono','Apple','Google','Sesiones activas']){await row(name).click();await check(name);await back();}
    }
    if(title==='Privacidad'){
      for(const name of ['Visibilidad del perfil','Quién puede ver tus planes','Control de ubicación','Quién puede enviarte mensajes','Solicitudes de conexión','Usuarios bloqueados','Datos y actividad']){await row(name).click();await check(name);await back();}
    }
    if(title==='Centro de ayuda'){
      for(const name of ['Guía de CONECTA','Normas de la comunidad','Seguridad en la app','Privacidad','Condiciones de uso','Soporte técnico','Enviar feedback']){await row(name).click();await check('Ayuda / '+name);await back();}
    }
    await back();
  }
  await page.locator('.settings-premium-entry').click();await check('Premium');
  console.log('LAYOUT_REPORT '+JSON.stringify({width,height,screens:reports.length,failures:reports.filter(r=>r.issues.length)}));
  await info.attach('layout-report',{body:JSON.stringify(reports,null,2),contentType:'application/json'});
  expect(reports.flatMap(r=>r.issues.map(issue=>({screen:r.label,...issue})))).toEqual([]);
 });
}
