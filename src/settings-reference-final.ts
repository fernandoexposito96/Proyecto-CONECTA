export {};

function findSettingsButton(label:string){
  return [...document.querySelectorAll<HTMLButtonElement>('.settings-page .settings-list button')]
    .find(btn=>btn.textContent?.includes(label));
}

function wirePremiumCard(root:ParentNode=document){
  const cards:HTMLElement[]=[];
  if(root instanceof HTMLElement && root.matches('.settings-page .gold-card'))cards.push(root);
  root.querySelectorAll?.<HTMLElement>('.settings-page .gold-card').forEach(card=>cards.push(card));
  cards.forEach(card=>{
    if(card.dataset.referenceReady)return;
    card.dataset.referenceReady='1';
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

function markActivePresets(root:ParentNode=document){
  const buttons:HTMLButtonElement[]=[];
  if(root instanceof HTMLButtonElement && root.matches('[data-preset]'))buttons.push(root);
  root.querySelectorAll?.<HTMLButtonElement>('[data-preset]').forEach(btn=>buttons.push(btn));
  buttons.forEach(btn=>{
    if(btn.dataset.referencePresetReady)return;
    btn.dataset.referencePresetReady='1';
    btn.addEventListener('click',()=>{
      const sheet=btn.closest('.settings-max-sheet') || document;
      sheet.querySelectorAll('[data-preset]').forEach(x=>x.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

function enhanceWithin(root:ParentNode){
  wirePremiumCard(root);
  markActivePresets(root);
}

function run(){enhanceWithin(document)}

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

const referenceObserver=new MutationObserver(mutations=>{
  for(const mutation of mutations){
    mutation.addedNodes.forEach(node=>{
      if(node instanceof HTMLElement || node instanceof DocumentFragment)pendingRoots.add(node);
    });
  }
  if(pendingRoots.size)schedule();
});

const start=()=>{
  run();
  if(document.body)referenceObserver.observe(document.body,{subtree:true,childList:true});
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
