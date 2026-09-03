const CACHE='conecta-v1';
const APP_ROOT='/Proyecto-CONECTA/';
const APP_INDEX='/Proyecto-CONECTA/index.html';
const CORE=[APP_ROOT,APP_INDEX,'/Proyecto-CONECTA/manifest.json','/Proyecto-CONECTA/conecta-icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
      if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(APP_INDEX,copy));return response;}
      return caches.match(APP_INDEX).then(cached=>cached||fetch(APP_INDEX,{cache:'no-store'}));
    }).catch(()=>caches.match(APP_INDEX).then(cached=>cached||fetch(APP_INDEX,{cache:'no-store'}))));
    return;
  }
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request)));
});
