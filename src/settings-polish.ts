export {};

function toast(message:string){
  document.querySelector('.settings-toast')?.remove();
  const el=document.createElement('div');
  el.className='settings-toast';
  el.textContent=message;
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show'));
  window.setTimeout(()=>{el.classList.remove('show');window.setTimeout(()=>el.remove(),180)},1800);
}

function findSettingsButton(label:string){
  return [...document.querySelectorAll<HTMLButtonElement>('.settings-page .settings-list button')]
    .find(btn=>btn.textContent?.includes(label));
}

function wirePremiumCard(root:ParentNode=document){
  const cards:HTMLElement[]=[];
  if(root instanceof HTMLElement && root.matches('.settings-page .gold-card'))cards.push(root);
  root.querySelectorAll?.<HTMLElement>('.settings-page .gold-card').forEach(card=>cards.push(card));
  cards.forEach(card=>{
    if(card.dataset.premiumReady)return;
    card.dataset.premiumReady='1';
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.setAttribute('aria-label','Abrir CONECTA Premium');
    const open=()=>findSettingsButton('Cuenta y Premium')?.click();
    card.addEventListener('click',open);
    card.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}
    });
  });
}

function wrapCardBody(card:HTMLElement){
  if(card.dataset.polished)return;
  card.dataset.polished='1';
  const title=card.querySelector(':scope > h3');
  if(!title)return;
  const body=document.createElement('div');
  body.className='settings-card-body';
  let node=title.nextSibling;
  while(node){const next=node.nextSibling;body.appendChild(node);node=next}
  card.appendChild(body);
  card.classList.add('settings-collapsible');
  const toggle=document.createElement('button');
  toggle.type='button';
  toggle.className='settings-card-toggle';
  toggle.setAttribute('aria-expanded','false');
  toggle.innerHTML='<span>Ver opciones</span><b>⌄</b>';
  title.insertAdjacentElement('afterend',toggle);
  const setOpen=(open:boolean)=>{
    card.classList.toggle('open',open);
    toggle.setAttribute('aria-expanded',String(open));
    const label=toggle.querySelector('span');
    if(label)label.textContent=open?'Ocultar':'Ver opciones';
  };
  toggle.addEventListener('click',()=>setOpen(!card.classList.contains('open')));
  (card as HTMLElement & {__setOpen?:(value:boolean)=>void}).__setOpen=setOpen;
}

function buildIndex(sheet:HTMLElement){
  if(sheet.querySelector('.settings-section-index'))return;
  const content=sheet.querySelector('.settings-max-content');
  if(!content)return;
  const cards=[...content.querySelectorAll<HTMLElement>(':scope > .settings-max-card')].filter(c=>c.querySelector(':scope > h3'));
  if(cards.length<2)return;
  const nav=document.createElement('nav');
  nav.className='settings-section-index';
  nav.setAttribute('aria-label','Secciones de ajustes');
  cards.forEach((card,i)=>{
    const title=card.querySelector(':scope > h3')?.textContent?.trim()||`Sección ${i+1}`;
    const btn=document.createElement('button');
    btn.type='button';
    btn.textContent=title;
    btn.addEventListener('click',()=>{
      const setOpen=(card as HTMLElement & {__setOpen?:(value:boolean)=>void}).__setOpen;
      setOpen?.(true);
      card.scrollIntoView({behavior:'smooth',block:'start'});
    });
    nav.appendChild(btn);
  });
  content.insertBefore(nav,content.firstChild);
}

function wireFeedback(sheet:HTMLElement){
  if(sheet.dataset.feedbackReady)return;
  sheet.dataset.feedbackReady='1';
  sheet.addEventListener('change',e=>{
    const target=e.target;
    if(target instanceof HTMLInputElement && target.matches('input[type="checkbox"]')) toast(target.checked?'Activado':'Desactivado');
  });
  sheet.addEventListener('click',e=>{
    const target=e.target;
    if(!(target instanceof Element))return;
    const btn=target.closest<HTMLButtonElement>('[data-preset]');
    if(!btn)return;
    sheet.querySelectorAll('[data-preset]').forEach(x=>x.classList.remove('selected'));
    btn.classList.add('selected');
    toast(`Tema ${btn.textContent?.trim()||''} aplicado`);
  });
}

function polishSheet(sheet:HTMLElement){
  if(sheet.dataset.uiPolished)return;
  const content=sheet.querySelector('.settings-max-content');
  if(!content)return;
  sheet.dataset.uiPolished='1';
  const cards=[...content.querySelectorAll<HTMLElement>(':scope > .settings-max-card')];
  cards.forEach(wrapCardBody);
  cards.forEach((card,i)=>{
    const setOpen=(card as HTMLElement & {__setOpen?:(value:boolean)=>void}).__setOpen;
    const heading=card.querySelector(':scope > h3')?.textContent?.trim()||'';
    setOpen?.(i===0 || heading==='Apariencia');
  });
  buildIndex(sheet);
  wireFeedback(sheet);
}

function enhanceWithin(root:ParentNode){
  wirePremiumCard(root);
  if(root instanceof HTMLElement && root.matches('.settings-max-sheet'))polishSheet(root);
  root.querySelectorAll?.<HTMLElement>('.settings-max-sheet').forEach(polishSheet);
}

let scheduled=false;
const pendingRoots=new Set<ParentNode>();
const schedule=()=>{
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    const roots=[...pendingRoots];
    pendingRoots.clear();
    roots.forEach(enhanceWithin);
  });
};

const observer=new MutationObserver(mutations=>{
  for(const mutation of mutations){
    mutation.addedNodes.forEach(node=>{
      if(node instanceof HTMLElement || node instanceof DocumentFragment)pendingRoots.add(node);
    });
  }
  if(pendingRoots.size)schedule();
});

const start=()=>{
  enhanceWithin(document);
  if(document.body)observer.observe(document.body,{subtree:true,childList:true});
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
