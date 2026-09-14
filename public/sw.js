/* CONECTA — service worker seguro. */
const CACHE_NAME='conecta-runtime-v8';
const MAX_RUNTIME_ENTRIES=160;
const SHELL=['./','./index.html','./offline.html','./image-fallback.svg','./icon.svg','./icon-maskable.svg','./manifest.webmanifest','./apple-touch-icon.png','./apple-touch-icon-120.png','./apple-touch-icon-152.png','./apple-touch-icon-167.png'];
const shellUrls=new Set(SHELL.map(path=>new URL(path,self.location.href).href));

async function trimCache(cache,maxEntries){
  const keys=await cache.keys();
  // Never evict the application shell to make room for downloaded images.
  const disposable=keys.filter(request=>!shellUrls.has(request.url)&&!/\.(?:js|css)$/.test(new URL(request.url).pathname));
  await Promise.all(disposable.slice(0,Math.max(0,keys.length-maxEntries)).map(request=>cache.delete(request)));
}
async function cacheDocument(cache,response){
  const html=await response.clone().text();
  const assets=[...html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g)]
    .map(match=>new URL(match[1],self.registration.scope))
    .filter(url=>url.origin===self.location.origin);
  // Publish an offline document only after all of its entry assets are cached.
  await Promise.all(assets.map(async url=>{
    if(await cache.match(url.href))return;
    const asset=await fetch(url.href,{cache:'no-cache'});
    if(!asset.ok)throw new Error('Application asset unavailable');
    await cache.put(url.href,asset);
  }));
  await cache.put('./index.html',response.clone());
}
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll(SHELL);
    const document=await cache.match('./index.html');
    if(document)await cacheDocument(cache,document);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('conecta-')&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await trimCache(await caches.open(CACHE_NAME),MAX_RUNTIME_ENTRIES);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin||url.pathname.endsWith('/sw.js'))return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(!response.ok)throw new Error('Navigation unavailable');
        try{await cacheDocument(cache,response);await trimCache(cache,MAX_RUNTIME_ENTRIES);}catch{/* Keep the last complete offline shell. */}
        return response;
      }catch{return (await cache.match('./index.html'))||(await cache.match('./offline.html'))||Response.error();}
    })());return;
  }
  const freshAsset=['script','style'].includes(request.destination)||url.pathname.endsWith('.webmanifest');
  if(freshAsset){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      try{
        const response=await fetch(request,{cache:'no-cache'});
        if(!response.ok)throw new Error('Asset unavailable');
        try{await cache.put(request,response.clone());await trimCache(cache,MAX_RUNTIME_ENTRIES);}catch{/* Storage exhaustion must not break an online response. */}
        return response;
      }catch{return (await cache.match(request,{ignoreVary:true}))||Response.error();}
    })());return;
  }
  if(!['image','font'].includes(request.destination))return;
  const network=caches.open(CACHE_NAME).then(async cache=>{
    const response=await fetch(request);
    if(response.ok){try{await cache.put(request,response.clone());await trimCache(cache,MAX_RUNTIME_ENTRIES);}catch{/* Best-effort media cache. */}}
    return response;
  }).catch(()=>null);
  event.waitUntil(network);
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    return (await cache.match(request,{ignoreVary:true}))||(await network)||Response.error();
  })());
});
self.addEventListener('push',event=>{
  let payload={title:'CONECTA',body:'Tienes una novedad en CONECTA.',url:'./'};
  try{if(event.data)payload={...payload,...event.data.json()};}catch{if(event.data)payload.body=event.data.text();}
  const options={body:payload.body,icon:'./icon-512.png',badge:'./icon-512.png',data:{url:payload.url||'./'},tag:payload.tag||'conecta-notification',renotify:Boolean(payload.renotify)};
  event.waitUntil(self.registration.showNotification(payload.title||'CONECTA',options));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  let target=new URL(self.registration.scope);
  try{
    const requested=new URL(event.notification.data?.url||'./',self.registration.scope);
    if(requested.origin===target.origin&&requested.pathname.startsWith(target.pathname))target=requested;
  }catch{/* Invalid push links open the application, never a foreign site. */}
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if(client.url.startsWith(self.registration.scope)&&'focus' in client){
        if('navigate' in client)await client.navigate(target.href);
        return client.focus();
      }
    }
    return self.clients.openWindow?self.clients.openWindow(target.href):undefined;
  })());
});
self.addEventListener('sync',event=>{
  if(event.tag!=='conecta-retry')return;
  event.waitUntil((async()=>{
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of clients)client.postMessage({type:'CONECTA_BACKGROUND_SYNC'});
  })());
});
