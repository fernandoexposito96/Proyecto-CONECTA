import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, LocateFixed, MapPin } from 'lucide-react';
import type { Plan } from '../types';

type Point={plan:Plan;lat:number;lng:number};
type LeafletWindow=Window&{L?:any};
const TARRAGONA:[number,number]=[41.1189,1.2445];

function loadLeaflet(){
  return new Promise<any>((resolve,reject)=>{
    const w=window as LeafletWindow;if(w.L)return resolve(w.L);
    if(!document.querySelector('link[data-conecta-leaflet]')){const link=document.createElement('link');link.rel='stylesheet';link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';link.dataset.conectaLeaflet='1';document.head.appendChild(link)}
    const existing=document.querySelector('script[data-conecta-leaflet]') as HTMLScriptElement|null;
    if(existing){existing.addEventListener('load',()=>resolve((window as LeafletWindow).L));existing.addEventListener('error',reject);return}
    const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.dataset.conectaLeaflet='1';script.onload=()=>resolve((window as LeafletWindow).L);script.onerror=reject;document.head.appendChild(script);
  });
}

async function geocode(plan:Plan):Promise<Point|null>{
  if(Number.isFinite(plan.latitude)&&Number.isFinite(plan.longitude))return {plan,lat:plan.latitude!,lng:plan.longitude!};
  if(!plan.place||plan.place==='Lugar por confirmar'||plan.place==='Mi ubicación')return null;
  try{const q=encodeURIComponent(`${plan.place}, Spain`);const response=await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,{headers:{'Accept-Language':'es'}});if(!response.ok)return null;const rows=await response.json() as Array<{lat:string;lon:string}>;if(!rows[0])return null;return {plan,lat:Number(rows[0].lat),lng:Number(rows[0].lon)}}catch{return null}
}

export function MapView({plans,onBack,onPlan}:{plans:Plan[];onBack:()=>void;onPlan:(plan:Plan)=>void}){
  const node=useRef<HTMLDivElement|null>(null);const mapRef=useRef<any>(null);const [selected,setSelected]=useState<Plan|null>(null);const [status,setStatus]=useState('Cargando mapa y ubicaciones…');
  useEffect(()=>{let alive=true;let map:any;void (async()=>{const L=await loadLeaflet();if(!alive||!node.current)return;map=L.map(node.current,{zoomControl:false}).setView(TARRAGONA,11);mapRef.current=map;L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);L.control.zoom({position:'bottomright'}).addTo(map);
    const points=(await Promise.all(plans.map(geocode))).filter((p):p is Point=>Boolean(p));if(!alive)return;for(const point of points){const marker=L.marker([point.lat,point.lng]).addTo(map);marker.bindTooltip(point.plan.title,{direction:'top'});marker.on('click',()=>setSelected(point.plan))}if(points.length){const bounds=L.latLngBounds(points.map(p=>[p.lat,p.lng]));map.fitBounds(bounds.pad(.18),{maxZoom:14})}setStatus(points.length?`${points.length} planes ubicados en el mapa`:'No hay planes con una ubicación reconocible todavía');
  })().catch(()=>setStatus('No se ha podido cargar el mapa. Comprueba la conexión.'));return()=>{alive=false;if(map){map.remove();mapRef.current=null}}},[plans]);
  const locate=()=>{if(!navigator.geolocation)return;setStatus('Buscando tu ubicación…');navigator.geolocation.getCurrentPosition(pos=>{mapRef.current?.flyTo([pos.coords.latitude,pos.coords.longitude],14);setStatus('Mostrando tu ubicación actual')},()=>setStatus('No has permitido usar tu ubicación'),{enableHighAccuracy:true,timeout:10000})};
  return <div className="real-map-page"><div ref={node} className="real-map-canvas"/><header className="real-map-header"><button onClick={onBack} aria-label="Volver"><ChevronLeft/></button><div><strong>Mapa de planes</strong><span>{status}</span></div></header><button className="real-map-locate" onClick={locate}><LocateFixed/> Mi ubicación</button>{selected&&<button className="real-map-plan" onClick={()=>onPlan(selected)}><img src={selected.image} alt=""/><span><small>{selected.time}</small><strong>{selected.title}</strong><em><MapPin/>{selected.place}</em></span><b>Ver plan</b></button>}</div>;
}
