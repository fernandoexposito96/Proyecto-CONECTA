/* CONECTA — service worker seguro. */
const CACHE_NAME='conecta-runtime-v6';
const MAX_RUNTIME_ENTRIES=160;
const SHELL=['./','./index.html','./offline.html','./icon.svg','./icon-maskable.svg','./manifest.webmanifest','./apple-touch-icon.png','./apple-touch-icon-120.png','./apple-touch-icon-152.png','./apple-touch-icon-167.png'];

async function trimCache(cache,maxEntries){const keys=await cache.keys();if(keys.length<=maxEntries)return;await Promise.all(keys.slice(0,keys.length-maxEntries).map(request=>cache.delete(request)));}
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('conecta-')&&key!==CACHE_NAME).map(key=>caches.delete(key)));await trimCache(await caches.open(CACHE_NAME),MAX_RUNTIME_ENTRIES);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin||url.pathname.endsWith('/sw.js'))return;if(request.mode==='navigate'){event.respondWith((async()=>{try{const response=await fetch(request,{cache:'no-store'});if(response.ok){const cache=await caches.open(CACHE_NAME);await cache.put('./index.html',response.clone());await trimCache(cache,MAX_RUNTIME_ENTRIES);}return response;}catch{return (await caches.match('./index.html'))||(await caches.match('./'))||(await caches.match('./offline.html'))||Response.error();}})());return;}const cacheable=['script','style','image','font'].includes(request.destination)||url.pathname.endsWith('.webmanifest');if(!cacheable)return;event.respondWith((async()=>{const cache=await caches.open(CACHE_NAME);const cached=await cache.match(request);const network=fetch(request).then(async response=>{if(response.ok){await cache.put(request,response.clone());await trimCache(cache,MAX_RUNTIME_ENTRIES);}return response;}).catch(()=>null);return cached||(await network)||Response.error();})());});

self.addEventListener('push',event=>{
  let payload={title:'CONECTA',body:'Tienes una novedad en CONECTA.',url:'./'};
  try{if(event.data)payload={...payload,...event.data.json()};}catch{if(event.data)payload.body=event.data.text();}
  const options={body:payload.body,icon:'./icon-512.png',badge:'./icon-512.png',data:{url:payload.url||'./'},tag:payload.tag||'conecta-notification',renotify:Boolean(payload.renotify)};
  event.waitUntil(self.registration.showNotification(payload.title||'CONECTA',options));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||'./',self.location.href).href;
  event.waitUntil((async()=>{const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of windows){if('focus' in client){if('navigate' in client)await client.navigate(target);return client.focus();}}return self.clients.openWindow?self.clients.openWindow(target):undefined;})());
});

self.addEventListener('sync',event=>{
  if(event.tag!=='conecta-retry')return;
  event.waitUntil((async()=>{const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of clients)client.postMessage({type:'CONECTA_BACKGROUND_SYNC'});})());
});
