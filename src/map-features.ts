export {};

type MapPlan={title:string;category:string;place:string;lat:number;lng:number;distanceKm:number;now:boolean};

const plans:MapPlan[]=[
  {title:'Pádel Sunset',category:'Deporte',place:'Club Pádel Tarragona',lat:41.1189,lng:1.2445,distanceKm:5,now:true},
  {title:'Cena entre amigos',category:'Comida',place:'Tarragona centro',lat:41.1172,lng:1.2534,distanceKm:2,now:true},
  {title:'Café y gente nueva',category:'Café',place:'Rambla Nova',lat:41.1166,lng:1.2507,distanceKm:3,now:false},
  {title:'Running por la costa',category:'Deporte',place:'La Pineda',lat:41.0764,lng:1.1816,distanceKm:7,now:true},
  {title:'Noche de música',category:'Música',place:'Sala Zero',lat:41.1114,lng:1.2527,distanceKm:4,now:false},
  {title:'Tarde de playa',category:'Playa',place:'Platja Llarga',lat:41.1291,lng:1.3197,distanceKm:9,now:false}
];

const catIcon:Record<string,string>={Deporte:'🏃',Comida:'🍽️',Café:'☕',Música:'🎵',Playa:'🏖️'};

function renderMap(root:ParentNode=document){
  const explore=root.querySelector<HTMLElement>('.explore-page');
  if(!explore||explore.querySelector('.conecta-map-card')) return;
  const anchor=explore.querySelector('.category-grid');
  if(!anchor) return;
  const card=document.createElement('section');
  card.className='conecta-map-card';
  card.innerHTML=`<div class="map-head"><div><small>MAPA DE PLANES</small><h2>Planes activos cerca de ti</h2></div><span class="live-badge">● EN VIVO</span></div>
  <div class="map-filters"><select data-map-category><option value="all">Todas las categorías</option><option>Deporte</option><option>Comida</option><option>Café</option><option>Música</option><option>Playa</option></select><select data-map-distance><option value="999">Cualquier distancia</option><option value="5">Menos de 5 km</option><option value="10">Menos de 10 km</option><option value="20">Menos de 20 km</option></select></div>
  <div class="map-canvas" aria-label="Mapa de planes"><div class="map-gridlines"></div><div class="map-user-dot" title="Tu ubicación"></div><div class="map-pins"></div></div>
  <div class="map-selected" hidden></div>`;
  anchor.parentElement?.insertBefore(card,anchor);
  const category=card.querySelector<HTMLSelectElement>('[data-map-category]')!;
  const distance=card.querySelector<HTMLSelectElement>('[data-map-distance]')!;
  const selected=card.querySelector<HTMLElement>('.map-selected')!;
  const pins=card.querySelector<HTMLElement>('.map-pins')!;

  const draw=()=>{
    const max=Number(distance.value); const cat=category.value;
    pins.innerHTML='';
    plans.filter(p=>(cat==='all'||p.category===cat)&&p.distanceKm<=max).forEach((p,i)=>{
      const b=document.createElement('button');
      b.className=`map-pin ${p.now?'is-now':''}`;
      b.style.left=`${14+(i*14)%72}%`; b.style.top=`${18+(i*19)%58}%`;
      b.innerHTML=`<span>${catIcon[p.category]||'📍'}</span><b>${p.distanceKm} km</b>${p.now?'<i>Ahora</i>':''}`;
      b.title=`${p.title} · ${p.distanceKm} km`;
      b.addEventListener('click',()=>{
        selected.hidden=false;
        selected.innerHTML=`<div><strong>${p.title}</strong><span>${p.category} · ${p.place} · ${p.distanceKm} km</span>${p.now?'<small>Actualización en vivo · Ahora mismo</small>':''}</div><button data-route>Ver ruta</button>`;
        selected.querySelector<HTMLButtonElement>('[data-route]')?.addEventListener('click',()=>window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`,'_blank','noopener,noreferrer'));
      });
      pins.appendChild(b);
    });
  };
  category.addEventListener('change',draw); distance.addEventListener('change',draw); draw();

  const refresh=()=>{
    card.querySelector('.live-badge')?.setAttribute('title',`Última actualización ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`);
    draw();
  };
  window.setInterval(refresh,30000);
}

function applyMapFeatures(){renderMap(document)}
applyMapFeatures();
const mapFeaturesObserver=new MutationObserver(applyMapFeatures);
mapFeaturesObserver.observe(document.body,{childList:true,subtree:true});
