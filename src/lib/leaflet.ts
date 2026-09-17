type LeafletWindow=Window&{L?:any};
let pending:Promise<any>|null=null;

export function loadLeaflet():Promise<any>{
  if(!document.querySelector('link[data-conecta-leaflet]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.dataset.conectaLeaflet='1';
    link.addEventListener('error',()=>link.remove(),{once:true});
    document.head.appendChild(link);
  }
  const loaded=(window as LeafletWindow).L;
  if(loaded)return Promise.resolve(loaded);
  if(pending)return pending;

  pending=new Promise<any>((resolve,reject)=>{
    const existing=document.querySelector<HTMLScriptElement>('script[data-conecta-leaflet]');
    const script=existing||document.createElement('script');
    const cleanup=()=>{
      window.clearTimeout(timer);
      script.removeEventListener('load',onLoad);
      script.removeEventListener('error',onError);
    };
    const onError=()=>{
      cleanup();
      script.remove();
      reject(new Error('Leaflet unavailable'));
    };
    const onLoad=()=>{
      const leaflet=(window as LeafletWindow).L;
      if(!leaflet){onError();return;}
      cleanup();
      resolve(leaflet);
    };
    const timer=window.setTimeout(onError,15000);
    script.addEventListener('load',onLoad,{once:true});
    script.addEventListener('error',onError,{once:true});
    if(!existing){
      script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.dataset.conectaLeaflet='1';
      document.head.appendChild(script);
    }
  }).finally(()=>{pending=null;});
  return pending;
}
