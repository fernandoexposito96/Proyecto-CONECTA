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

const referenceObserver=new MutationObserver(mutations=>{
  for(const mutation of mutations){
    mutation.addedNodes.forEach(node=>{
      if(node instanceof HTMLElement || node instanceof DocumentFragment)wirePremiumCard(node);
    });
  }
});

const start=()=>{
  wirePremiumCard(document);
  if(document.body)referenceObserver.observe(document.body,{subtree:true,childList:true});
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
