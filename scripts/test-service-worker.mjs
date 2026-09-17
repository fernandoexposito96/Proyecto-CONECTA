import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('public/sw.js','utf8');
const scope='https://example.test/Proyecto-CONECTA/';
const prefix=`conecta-runtime:${encodeURIComponent(scope)}:`;
const current=`${prefix}v10`;

function harness(){
  const listeners=new Map(), stores=new Map(), calls=[], posted=[], opened=[];
  const absolute=value=>new URL(typeof value==='string'?value:value.url,scope).href;
  const caches={
    async open(name){
      if(!stores.has(name)){
        const entries=new Map();
        stores.set(name,{
          async keys(){return [...entries.keys()].map(url=>({url}));},
          async match(request){return entries.get(absolute(request))?.clone();},
          async put(request,response){entries.set(absolute(request),response.clone());},
          async delete(request){return entries.delete(absolute(request));},
        });
      }
      return stores.get(name);
    },
    async keys(){return [...stores.keys()];},
    async delete(name){return stores.delete(name);},
  };
  const clients=[
    {url:scope,postMessage:message=>posted.push({url:scope,message})},
    {url:'https://example.test/another-app/',postMessage:message=>posted.push({url:'other',message})},
  ];
  let network=async()=>new Response('asset');
  const context=vm.createContext({
    URL,Request,Response,console,caches,
    fetch:async(request,options)=>{calls.push(absolute(request));return network(request,options);},
    self:{
      location:new URL('sw.js',scope),
      registration:{scope},
      addEventListener:(name,handler)=>listeners.set(name,handler),
      clients:{claim:async()=>{},matchAll:async()=>clients,openWindow:async url=>{opened.push(url);}},
    },
  });
  vm.runInContext(source,context,{filename:'public/sw.js'});
  const dispatch=async(name,fields={})=>{
    const pending=[];let response;
    listeners.get(name)({...fields,waitUntil:promise=>pending.push(promise),respondWith:promise=>{response=promise;}});
    const result=await response;
    await Promise.all(pending);
    return result;
  };
  return {caches,calls,posted,opened,dispatch,setNetwork:fn=>{network=fn;},context};
}

{
  const h=harness();
  const other='conecta-runtime:'+encodeURIComponent('https://example.test/another-app/')+':v10';
  for(const name of [current,prefix+'v9',other,'unrelated-cache','conecta-runtime-v9-map-release'])await h.caches.open(name);
  await h.dispatch('activate');
  assert.equal((await h.caches.keys()).includes(prefix+'v9'),false);
  for(const name of [current,other,'unrelated-cache','conecta-runtime-v9-map-release'])assert.ok((await h.caches.keys()).includes(name));
  assert.deepEqual(h.posted.map(item=>item.url),[scope]);
  await h.dispatch('sync',{tag:'conecta-retry'});
  assert.deepEqual(h.posted.map(item=>item.url),[scope,scope]);
  console.log('✓ Cache cleanup and client messages stay within the installation scope');
}
{
  const h=harness();
  for(const request of [
    {method:'POST',url:scope},
    {method:'GET',url:'https://backend.test/private',destination:'script'},
    {method:'GET',url:scope+'sw.js',destination:'script'},
    {method:'GET',url:scope+'api/private',destination:''},
  ])assert.equal(await h.dispatch('fetch',{request}),undefined);
  assert.equal(h.calls.length,0);
  console.log('✓ Non-GET, external, worker and API requests bypass the cache');
}
{
  const h=harness(),cache=await h.caches.open(current);
  const html='<script src="./assets/index-abcdefgh.js"></script><link href="./assets/index-abcdefgh.css">';
  h.setNetwork(async request=>new Response(typeof request==='string'?'asset':html));
  const request={method:'GET',mode:'navigate',url:scope};
  assert.equal(await (await h.dispatch('fetch',{request})).text(),html);
  assert.equal(h.calls.length,3);
  await h.dispatch('fetch',{request});
  assert.equal(h.calls.length,4,'unchanged fingerprinted assets must not be downloaded again');
  h.setNetwork(async()=>{throw new Error('offline');});
  assert.equal(await (await h.dispatch('fetch',{request})).text(),html);
  assert.equal(await (await h.dispatch('fetch',{request:{method:'GET',destination:'script',url:scope+'assets/index-abcdefgh.js'}})).text(),'asset');
  const newer='<script src="./assets/index-ijklmnop.js"></script>';
  h.setNetwork(async request=>typeof request==='string'?new Response('missing',{status:404}):new Response(newer));
  assert.equal(await (await h.dispatch('fetch',{request})).text(),newer);
  assert.equal(await (await cache.match('./index.html')).text(),html,'failed assets must not replace the working offline document');
  console.log('✓ Navigation reuses versioned assets and preserves a working offline document');
}
{
  const h=harness(),cache=await h.caches.open(current);
  const html='<script src="./runtime.js"></script>';
  h.setNetwork(async request=>new Response(typeof request==='string'?'asset':html));
  const request={method:'GET',mode:'navigate',url:scope};
  await h.dispatch('fetch',{request});await h.dispatch('fetch',{request});
  assert.equal(h.calls.filter(url=>url.endsWith('/runtime.js')).length,2,'unversioned resources must still refresh');
  await cache.put('./offline.html',new Response('offline page'));
  await cache.delete('./index.html');
  h.setNetwork(async()=>{throw new Error('offline');});
  assert.equal(await (await h.dispatch('fetch',{request})).text(),'offline page');
  console.log('✓ Unversioned resources refresh and the standalone offline fallback remains usable');
}
{
  const h=harness();
  for(const url of ['https://outside.test/','../another-app/','./?shortcut=chat']){
    await h.dispatch('notificationclick',{notification:{data:{url},close(){}}});
  }
  assert.deepEqual(h.opened,[scope,scope,scope+'?shortcut=chat']);
  console.log('✓ Notifications cannot navigate outside the application');
}
console.log('CONECTA service worker behavior tests: OK');
