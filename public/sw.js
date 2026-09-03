const CACHE='conecta-v1-performance-2';
const APP_ROOT='/Proyecto-CONECTA/';
const APP_INDEX='/Proyecto-CONECTA/index.html';
const CORE=[APP_ROOT,APP_INDEX,'/Proyecto-CONECTA/manifest.json','/Proyecto-CONECTA/conecta-icon.svg'];

const cacheResponse=async(request,response)=>{
  if(!response?.ok) return response;
  const cache=await caches.open(CACHE);
  await cache.put(request,response.clone());
  return response;
};

const networkFirst=async(request,fallback)=>{
  try{
    const response=await fetch(request,{cache:'no-store'});
    return await cacheResponse(fallback||request,response);
  }catch{
    return (await caches.match(fallback||request)) || (fallback?fetch(fallback,{cache:'no-store'}):Response.error());
  }
};

const cacheFirst=async(request)=>{
  const cached=await caches.match(request);
  if(cached) return cached;
  const response=await fetch(request);
  return cacheResponse(request,response);
};

const staleWhileRevalidate=async(request)=>{
  const cached=await caches.match(request);
  const refresh=fetch(request).then(response=>cacheResponse(request,response)).catch(()=>null);
  if(cached){void refresh;return cached;}
  return (await refresh) || Response.error();
};

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;

  if(event.request.mode==='navigate'){
    event.respondWith(networkFirst(event.request,APP_INDEX));
    return;
  }

  if(url.pathname.includes('/assets/')){
    /* Vite filenames are content-hashed, so cache-first is safe and fast. */
    event.respondWith(cacheFirst(event.request));
    return;
  }

  if(event.request.destination==='image'){
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  event.respondWith(networkFirst(event.request));
});
