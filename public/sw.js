/* CONECTA — service worker seguro.
   - Nunca intercepta Supabase ni otros dominios.
   - Navegación: red primero, caché como respaldo offline.
   - Assets: stale-while-revalidate para acelerar sin bloquear actualizaciones.
   - Cada versión elimina cachés antiguas de CONECTA.
   - El runtime cache se recorta para evitar crecimiento indefinido. */

const CACHE_NAME='conecta-runtime-v5';
const MAX_RUNTIME_ENTRIES=160;
const SHELL=['./','./index.html','./offline.html','./icon.svg','./icon-maskable.svg','./manifest.webmanifest','./apple-touch-icon.png'];

async function trimCache(cache,maxEntries){
  const keys=await cache.keys();
  if(keys.length<=maxEntries)return;
  const excess=keys.length-maxEntries;
  await Promise.all(keys.slice(0,excess).map(request=>cache.delete(request)));
}

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('conecta-')&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    const cache=await caches.open(CACHE_NAME);
    await trimCache(cache,MAX_RUNTIME_ENTRIES);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;

  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(url.pathname.endsWith('/sw.js'))return;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(response.ok){
          const cache=await caches.open(CACHE_NAME);
          await cache.put('./index.html',response.clone());
          await trimCache(cache,MAX_RUNTIME_ENTRIES);
        }
        return response;
      }catch{
        return (await caches.match('./index.html'))||(await caches.match('./'))||(await caches.match('./offline.html'))||Response.error();
      }
    })());
    return;
  }

  const cacheable=request.destination==='script'||request.destination==='style'||request.destination==='image'||request.destination==='font'||url.pathname.endsWith('.webmanifest');
  if(!cacheable)return;

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(request);
    const network=fetch(request).then(async response=>{
      if(response.ok){
        await cache.put(request,response.clone());
        await trimCache(cache,MAX_RUNTIME_ENTRIES);
      }
      return response;
    }).catch(()=>null);
    return cached||(await network)||Response.error();
  })());
});
