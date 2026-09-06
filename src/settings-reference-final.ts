export {};

function findSettingsButton(label:string){
  return [...document.querySelectorAll<HTMLButtonElement>('.settings-page .settings-list button')]
    .find(btn=>btn.textContent?.includes(label));
}

function wirePremiumCard(){
  const card=document.querySelector<HTMLElement>('.settings-page .gold-card');
  if(!card || card.dataset.referenceReady)return;
  card.dataset.referenceReady='1';
  card.setAttribute('role','button');
  card.setAttribute('tabindex','0');
  card.setAttribute('aria-label','Abrir CONECTA Premium');
  const open=()=>findSettingsButton('Cuenta y Premium')?.click();
  card.addEventListener('click',open);
  card.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}
  });
}

function markActivePreset(){
  const sheet=document.querySelector<HTMLElement>('.settings-max-sheet');
  if(!sheet)return;
  const buttons=[...sheet.querySelectorAll<HTMLButtonElement>('[data-preset]')];
  if(!buttons.length)return;
  buttons.forEach(btn=>btn.addEventListener('click',()=>{
    buttons.forEach(x=>x.classList.remove('selected'));
    btn.classList.add('selected');
  },{once:false}));
}

function run(){wirePremiumCard();markActivePreset()}
const referenceObserver=new MutationObserver(run);
referenceObserver.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
