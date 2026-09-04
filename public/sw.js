const SHELL_CACHE='conecta-v7-shell';
const ASSET_CACHE='conecta-v7-assets';
const IMAGE_CACHE='conecta-v7-images';
const CURRENT_CACHES=new Set([SHELL_CACHE,ASSET_CACHE,IMAGE_CACHE]);

const scopeUrl=new URL(self.registration.scope);
const APP_ROOT=scopeUrl.pathname.endsWith('/')?scopeUrl.pathname:`${scopeUrl.pathname}/`;
const APP_INDEX=new URL('index.html',scopeUrl).pathname;
const MANIFEST=new URL('manifest.json',scopeUrl).pathname;
const ICON=new URL('conecta-icon.svg',scopeUrl).pathname;
const CORE=[APP_ROOT,APP_INDEX,MANIFEST,ICON];

const CACHE_LIMITS={
  [ASSET_CACHE]:120,
  [IMAGE_CACHE]:80,
};

const trimCache=async(cacheName)=>{
  const limit=CACHE_LIMITS[cacheName];
  if(!limit) return;
  const cache=await caches.open(cacheName);
  const requests=await cache.keys();
  const overflow=requests.length-limit;
  if(overflow<=0) return;
  await Promise.all(requests.slice(0,overflow).map(request=>cache.delete(request)));
};

const put=async(cacheName,request,response)=>{
  if(!response || (!response.ok && response.type!=='opaque')) return response;
  const cache=await caches.open(cacheName);
  await cache.put(request,response.clone());
  await trimCache(cacheName);
  return response;
};

const networkFirst=async(request,fallback)=>{
  try{
    const response=await fetch(request,{cache:'no-store'});
    return await put(SHELL_CACHE,fallback||request,response);
  }catch{
    return (await caches.match(fallback||request)) || (fallback?fetch(fallback,{cache:'no-store'}):Response.error());
  }
};

const cacheFirst=async(request)=>{
  const cached=await caches.match(request);
  if(cached) return cached;
  const response=await fetch(request,{cache:'default'});
  return put(ASSET_CACHE,request,response);
};

const staleWhileRevalidate=async(request)=>{
  const cached=await caches.match(request);
  const refresh=fetch(request,{cache:'default'}).then(response=>put(IMAGE_CACHE,request,response)).catch(()=>null);
  if(cached){void refresh;return cached;}
  return (await refresh) || Response.error();
};

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache=>cache.addAll(CORE.map(url=>new Request(url,{cache:'reload'})))),
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(
      keys
        .filter(key=>key.startsWith('conecta-')&&!CURRENT_CACHES.has(key))
        .map(key=>caches.delete(key)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin){
    if(event.request.destination==='image') event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  if(event.request.mode==='navigate'){
    event.respondWith(networkFirst(event.request,APP_INDEX));
    return;
  }

  if(url.pathname.includes('/assets/')){
    event.respondWith(cacheFirst(event.request));
    return;
  }

  if(event.request.destination==='image'){
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // Do not proxy unrelated same-origin requests. Browser-managed requests such
  // as telemetry and development probes must keep their native error semantics.
});
